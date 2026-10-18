import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { cleanText, MEDIA_EXTENSIONS, sourceUrl, UserError } from '../domain/catalogue.js';
import type { DownloadAdapter, DownloadRequest, StagedFile } from '../ports/index.js';
import type { Metadata, MediaFormat } from '../domain/model.js';

export interface ToolPaths { ytDlp: string; ffmpeg: string; }
export interface ToolVersions { ytDlp: string; ffmpeg: string; ffprobe: string; }
export function runProcess(executable: string, args: string[], signal: AbortSignal, line?: (value: string) => void, maxBytes = 8 * 1024 * 1024): Promise<string> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = ''; let pending = ''; let total = 0; let overflow = false; let killError = false;
    let stopping: Promise<void> | null = null;
    const stop = () => {
      if (stopping || !child.pid || child.exitCode !== null) return;
      if (process.platform === 'win32') {
        stopping = new Promise<void>(resolve => {
          const killer = spawn('C:\\Windows\\System32\\taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, shell: false, stdio: 'ignore' });
          killer.on('error', () => { killError = true; child.kill(); resolve(); });
          killer.on('close', code => { if (code) { killError = true; if (child.exitCode === null) child.kill(); } resolve(); });
        });
      } else child.kill('SIGKILL');
    };
    const aborted = () => stop(); signal.addEventListener('abort', aborted, { once: true });
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      total += Buffer.byteLength(chunk);
      if (total > maxBytes) { overflow = true; stop(); return; }
      stdout += chunk; pending += chunk;
      const lines = pending.split(/\r?\n/); pending = lines.pop() ?? ''; for (const value of lines) line?.(value);
    });
    child.stderr.on('data', (chunk: string) => { if (stderr.length < 65536) stderr += chunk.slice(0, 65536 - stderr.length); });
    child.on('error', error => { signal.removeEventListener('abort', aborted); if ((error as NodeJS.ErrnoException).code === 'ENOENT') reject(new UserError('Downloader tools are missing. Set --yt-dlp and --ffmpeg to installed executable paths. See README → Installation.', 'missing-dependency')); else reject(error); });
    child.on('close', async code => {
      await stopping;
      signal.removeEventListener('abort', aborted);
      if (signal.aborted) { reject(killError ? new UserError('Windows could not confirm the downloader tree stopped. Keep staging files and close the running tools before retrying.', 'cancellation-failure') : new DOMException('Operation cancelled.', 'AbortError')); return; }
      if (overflow) { reject(new UserError('The source returned too much metadata. Choose a single item URL.', 'unsupported-source')); return; }
      if (code !== 0) {
        const reason = /no space|disk full/i.test(stderr) ? 'The disk is full. Free space and retry.'
          : /unsupported url|no suitable|not available|requested format/i.test(stderr) ? 'This source or format is unavailable. Try a supported public single-item URL or choose another format.'
          : /sign in|login|cookies|private|403|401|age.restrict/i.test(stderr) ? 'This source requires authentication or denies access. Authenticated downloads are outside this release; choose a permitted public item.'
          : /permission|access.*denied/i.test(stderr) ? 'The downloader cannot write to this folder. Choose a writable local library.'
          : /timed out|unable to download|network|resolve|connection/i.test(stderr) ? 'The source could not be reached. Check the connection and URL, then retry.'
          : 'The downloader failed. Check the source and installed tool versions, then retry. Your catalogue is unchanged; inspect Recover if a save was committing.';
        reject(new UserError(reason, 'download-failure')); return;
      }
      if (pending) line?.(pending); resolve(stdout);
    });
    if (signal.aborted) stop();
  });
}

export class YtDlpDownloader implements DownloadAdapter {
  private versions: ToolVersions | undefined;
  constructor(readonly paths: ToolPaths) {}
  private base(): string[] { return ['--ignore-config', '--no-playlist', '--no-cache-dir', '--socket-timeout', '20', '--retries', '2', '--js-runtimes', `node:${process.execPath}`, '--ffmpeg-location', path.dirname(this.paths.ffmpeg)]; }
  async check(signal = AbortSignal.timeout(15000)): Promise<ToolVersions> {
    // Resolve PATH entries once so --ffmpeg-location points at the actual install directory.
    for (const key of ['ytDlp', 'ffmpeg'] as const) {
      const value = this.paths[key];
      if (path.isAbsolute(value)) continue;
      if (/[\\/]/.test(value)) { this.paths[key] = path.resolve(value); continue; }
      try {
        const resolved = await runProcess(process.platform === 'win32' ? 'C:\\Windows\\System32\\where.exe' : 'which', [value], signal, undefined, 16384);
        const first = resolved.split(/\r?\n/).find(line => line.trim());
        if (!first) throw new Error('not found'); this.paths[key] = first.trim();
      } catch { throw new UserError('Downloader tools are missing. Set --yt-dlp and --ffmpeg to installed executable paths. See README → Installation.', 'missing-dependency'); }
    }
    const ytDlp = (await runProcess(this.paths.ytDlp, ['--version'], signal)).trim();
    const ffmpeg = (await runProcess(this.paths.ffmpeg, ['-version'], signal)).split(/\r?\n/)[0] ?? '';
    const probe = path.join(path.dirname(this.paths.ffmpeg), process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
    const ffprobe = (await runProcess(probe, ['-version'], signal)).split(/\r?\n/)[0] ?? '';
    if (!/^20\d\d\.\d\d\.\d\d/.test(ytDlp) || !ffmpeg.startsWith('ffmpeg version ') || !ffprobe.startsWith('ffprobe version ')) throw new UserError('Unexpected downloader tool version output. Choose genuine yt-dlp, ffmpeg and ffprobe executables.', 'missing-dependency');
    this.versions = { ytDlp: cleanText(ytDlp), ffmpeg: cleanText(ffmpeg), ffprobe: cleanText(ffprobe) }; return this.versions;
  }
  async inspect(url: string, signal: AbortSignal): Promise<Metadata> {
    const normalized = sourceUrl(url); if (!this.versions) await this.check(signal);
    const output = await runProcess(this.paths.ytDlp, [...this.base(), '--dump-single-json', '--skip-download', '--', normalized], signal);
    let data: Record<string, unknown>;
    try { data = JSON.parse(output) as Record<string, unknown>; } catch { throw new UserError('The source returned invalid metadata. Try another single-item URL.', 'unsupported-source'); }
    if (data._type === 'playlist' || data.entries) throw new UserError('Choose a single media item. Playlists are outside this release.', 'unsupported-source');
    const value = (v: unknown, fallback: string, max: number) => typeof v === 'string' || typeof v === 'number' ? cleanText(String(v)).slice(0, max) || fallback : fallback;
    const rows = (Array.isArray(data.formats) ? data.formats : [data]).filter((f): f is Record<string, unknown> => !!f && typeof f === 'object');
    const valid = rows.filter(f => typeof f.format_id === 'string' && /^[a-zA-Z0-9_.-]+$/.test(f.format_id) && typeof f.ext === 'string' && /^[a-zA-Z0-9]+$/.test(f.ext) && (typeof f.url === 'string' || Array.isArray(f.fragments)));
    const formats: MediaFormat[] = [];
    const video = valid.filter(f => f.vcodec !== 'none' && f.vcodec !== undefined);
    const audio = valid.filter(f => f.vcodec === 'none' && f.acodec !== 'none');
    const bestAudio = audio.at(-1);
    for (const f of video.slice(-16).reverse()) {
      const separate = f.acodec === 'none'; if (separate && !bestAudio) continue;
      formats.push({ id: String(f.format_id) + (separate ? `+${String(bestAudio!.format_id)}` : ''), label: `Video · ${f.height ? String(f.height) + 'p' : 'source'} · ${separate ? 'MKV (video + audio)' : String(f.ext).toUpperCase()}`, extension: separate ? 'mkv' : String(f.ext) });
    }
    for (const f of audio.slice(-6).reverse()) formats.push({ id: String(f.format_id), label: `Audio · ${f.abr ? Math.round(Number(f.abr)) + ' kbps · ' : ''}${String(f.ext).toUpperCase()}`, extension: String(f.ext) });
    if (!formats.length && typeof data.url === 'string') formats.push({ id: 'best', label: `Source · ${value(data.ext, 'mp4', 10).toUpperCase()}`, extension: value(data.ext, 'mp4', 10) });
    if (!formats.length) throw new UserError('No supported video or audio format was found. Try a different public source.', 'unsupported-source');
    return { sourceUrl: normalized, title: value(data.title, 'Untitled reference', 500), extractor: value(data.extractor_key ?? data.extractor, 'generic', 100), sourceId: value(data.id, normalized, 300), formats };
  }
  async download(request: DownloadRequest, signal: AbortSignal, onProgress: (percent: number) => void): Promise<StagedFile> {
    sourceUrl(request.sourceUrl);
    if (!/^[a-zA-Z0-9_.+-]{1,200}$/.test(request.formatId)) throw new UserError('Select a format returned by the source.');
    const directory = path.resolve(request.stagingDirectory);
    const info = await fs.lstat(directory); if (!info.isDirectory() || info.isSymbolicLink()) throw new UserError('The staging directory is invalid.');
    let completed = '';
    await runProcess(this.paths.ytDlp, [...this.base(), '--no-simulate', '--newline', '--progress', '--progress-template', 'download:SP_PROGRESS:%(progress._percent_str)s', '--print', 'after_move:SP_FILE:%(filepath)j', '--no-overwrites', '--restrict-filenames', '--merge-output-format', 'mkv', '-f', request.formatId, '-o', path.join(directory, 'media.%(ext)s'), '--', request.sourceUrl], signal, line => {
      if (line.startsWith('SP_PROGRESS:')) { const percent = Number.parseFloat(line.slice(12).trim()); if (Number.isFinite(percent)) onProgress(Math.max(0, Math.min(99, percent))); }
      if (line.startsWith('SP_FILE:')) { try { completed = String(JSON.parse(line.slice(8))); } catch { /* require a valid completion marker below */ } }
    });
    if (!completed || path.dirname(path.resolve(completed)).toLocaleLowerCase() !== directory.toLocaleLowerCase()) throw new UserError('The downloader did not confirm a completed file inside staging.', 'verification-failure');
    const extension = path.extname(completed).slice(1).toLowerCase(); if (!MEDIA_EXTENSIONS.has(extension)) throw new UserError('Unsupported media extension. This release saves common video and audio files only.');
    return { absolutePath: completed, extension };
  }
}
