import * as fs from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { settingsFile } from './settings.js';
import { YtDlpDownloader } from './downloader.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
import type { ToolPaths } from './downloader.js';
import { UserError } from '../domain/catalogue.js';

export const toolSpec = {
  ytDlp: { version: '2026.08.19', name: 'yt-dlp.exe', bytes: 17840399, sha256: '66674953fe251b89f4d08c5f0e35e0728679bd67ab3d7d05c0562af101dd3e7a', url: 'https://github.com/yt-dlp/yt-dlp/releases/download/2026.08.19/yt-dlp.exe' },
  ffmpeg: { version: '9.0.2', name: 'ffmpeg.zip', bytes: 114768076, sha256: '60f467265b1e312373dbcd92200c2618a74850f98d3d078e94296bb3fa2047ba', url: 'https://www.gyan.dev/ffmpeg/builds/packages/ffmpeg-9.0.2-essentials_build.zip' }
} as const;
export const toolsRoot = () => path.join(path.dirname(settingsFile()), 'tools');
interface Manifest { schemaVersion: 1; release: string; versions: { ytDlp: string; ffmpeg: string }; hashes: Record<string, string>; origins: typeof toolSpec; }
const files = ['yt-dlp.exe', 'ffmpeg.exe', 'ffprobe.exe'] as const;
export async function sha256(file: string, signal?: AbortSignal): Promise<string> {
  const info = await fs.lstat(file); if (!info.isFile() || info.isSymbolicLink()) throw new UserError('Tool artifacts must be regular files, not links.');
  const hash = createHash('sha256'); for await (const chunk of createReadStream(file, signal ? { signal } : {})) hash.update(chunk); return hash.digest('hex');
}
async function removeOwned(directory: string, root: string): Promise<void> {
  const relative = path.relative(path.resolve(root), path.resolve(directory));
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Unsafe setup cleanup target');
  await absentOrPlain(directory); await fs.rm(directory, { recursive: true, force: true });
}
async function absentOrPlain(file: string): Promise<void> { const stat = await fs.lstat(file).catch(e => { if (e.code === 'ENOENT') return null; throw e; }); if (stat?.isSymbolicLink()) throw new UserError('Tool paths cannot be links.'); }
export async function readManagedTools(root = toolsRoot()): Promise<ToolPaths | null> {
  await absentOrPlain(root); const pointer = path.join(root, 'current.json'); await absentOrPlain(pointer);
  const data = await fs.readFile(pointer, 'utf8').catch(e => { if (e.code === 'ENOENT') return null; throw e; }); if (data === null) return null;
  try {
    if (data.length > 16384) throw Error(); const manifest = JSON.parse(data) as Manifest;
    if (manifest.schemaVersion !== 1 || !/^release-[a-f0-9-]{36}$/.test(manifest.release) || manifest.versions.ytDlp !== toolSpec.ytDlp.version || manifest.versions.ffmpeg !== toolSpec.ffmpeg.version) throw Error();
    const directory = path.join(root, manifest.release); await absentOrPlain(directory);
    for (const file of files) { if (!/^[a-f0-9]{64}$/.test(manifest.hashes[file] ?? '') || await sha256(path.join(directory, file)) !== manifest.hashes[file]) throw Error(); }
    if (manifest.hashes['yt-dlp.exe'] !== toolSpec.ytDlp.sha256) throw Error();
    return { ytDlp: path.join(directory, 'yt-dlp.exe'), ffmpeg: path.join(directory, 'ffmpeg.exe') };
  } catch { throw new UserError('Managed tools are incomplete or changed. Run sourcespool --setup --repair with a verified --tool-cache folder, or choose explicit tool paths.'); }
}
export interface InstallOptions { root?: string; sourceDirectory?: string; allowDownload?: boolean; repair?: boolean; signal?: AbortSignal; progress?: (message: string) => void; }
export async function installTools(options: InstallOptions = {}): Promise<ToolPaths> {
  if (process.platform !== 'win32' || process.arch !== 'x64') throw new UserError('Tool setup supports Windows x64 only.');
  const root = path.resolve(options.root ?? toolsRoot()); const signal = options.signal ?? new AbortController().signal;
  const progress = options.progress ?? (() => {}); signal.throwIfAborted(); await fs.mkdir(root, { recursive: true }); await absentOrPlain(path.dirname(root)); await absentOrPlain(root);
  const release = 'release-' + randomUUID(); const stage = path.join(root, release);
  const lock = path.join(root, 'setup.lock'); let handle;
  for (let attempt = 0; attempt < 2; attempt++) {
    try { handle = await fs.open(lock, 'wx'); break; }
    catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
      await absentOrPlain(lock); const owner = JSON.parse(await fs.readFile(lock, 'utf8')) as { pid: number; release?: string };
      if (!Number.isSafeInteger(owner.pid) || owner.pid < 1) throw new UserError('An unrecognized setup lock exists. Inspect it before retrying.');
      try { process.kill(owner.pid, 0); throw new UserError('Another tool setup is running. Wait for it to finish, then retry.'); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error; }
      if (owner.release && /^release-[a-f0-9-]{36}$/.test(owner.release)) {
        const active = await fs.readFile(path.join(root, 'current.json'), 'utf8').then(text => (JSON.parse(text) as Manifest).release).catch(e => { if (e.code === 'ENOENT') return null; throw new UserError('Inspect the managed-tool manifest before cleaning interrupted setup.'); });
        if (active !== owner.release) await removeOwned(path.join(root, owner.release), root);
      }
      await fs.unlink(lock);
    }
  }
  if (!handle) throw new UserError('Tool setup is busy. Retry when the other setup finishes.');
  await handle.writeFile(JSON.stringify({ pid: process.pid, release })); await handle.close();
  let promoted = false; const pointerTemp = path.join(root, '.current-' + randomUUID() + '.tmp');
  try {
    if (!options.repair) { const existing = await readManagedTools(root); if (existing) { await new YtDlpDownloader(existing).check(signal); progress('Reusing verified managed tools; no download.'); return existing; } }
    if (!options.sourceDirectory && !options.allowDownload) throw new UserError('Choose --tool-cache <folder> for existing downloads, or explicitly choose --download-tools. No download was started.');
    await fs.mkdir(stage); const archive = path.join(stage, 'ffmpeg.zip');
    for (const spec of [toolSpec.ytDlp, toolSpec.ffmpeg]) {
      signal.throwIfAborted(); const target = spec.name === 'ffmpeg.zip' ? archive : path.join(stage, 'yt-dlp.exe');
      if (options.sourceDirectory) {
        const source = path.join(path.resolve(options.sourceDirectory), spec.name); progress('Verifying cached ' + spec.name + '…');
        if (await sha256(source, signal) !== spec.sha256) throw new UserError('Checksum mismatch for cached ' + spec.name + '. No network fallback was attempted.');
        await fs.copyFile(source, target, 1);
      } else {
        progress('Downloading ' + spec.name + ' (' + (spec.bytes / 1e6).toFixed(1) + ' MB)…');
        const response = await fetch(spec.url, { signal: AbortSignal.any([signal, AbortSignal.timeout(180000)]) });
        if (!response.ok || !response.body) throw new UserError('Tool download failed: HTTP ' + response.status + '. Retry setup; the prior installation is preserved.');
        let received = 0; const body = Readable.fromWeb(response.body as import('node:stream/web').ReadableStream);
        body.on('data', (chunk: Buffer) => { received += chunk.length; if (received > spec.bytes + 1024) body.destroy(new Error('Tool download exceeds pinned size.')); });
        await pipeline(body, createWriteStream(target, { flags: 'wx' }), { signal });
      }
      if (await sha256(target, signal) !== spec.sha256) throw new UserError('Checksum mismatch for ' + spec.name + '. The file was not executed or extracted.');
    }
    progress('Extracting verified FFmpeg archive…');
    const prefix = 'ffmpeg-9.0.2-essentials_build/';
    const tar = path.join(process.env.SystemRoot ?? 'C:/Windows', 'System32', 'tar.exe');
    const entries = (await run(tar, ['-tf', 'ffmpeg.zip'], { cwd: stage, windowsHide: true, signal, maxBuffer: 8 * 1024 * 1024 })).stdout.split(/\r?\n/).filter(Boolean);
    if (!entries.length || entries.some(entry => !entry.startsWith(prefix) || entry.split('/').includes('..') || /[:\\]/.test(entry))) throw new UserError('Unexpected FFmpeg archive paths. Extraction refused.');
    await run(tar, ['-xf', 'ffmpeg.zip'], { cwd: stage, windowsHide: true, signal });
    for (const name of ['ffmpeg.exe', 'ffprobe.exe']) await fs.copyFile(path.join(stage, prefix, 'bin', name), path.join(stage, name), 1);
    signal.throwIfAborted(); const stagedPaths = { ytDlp: path.join(stage, 'yt-dlp.exe'), ffmpeg: path.join(stage, 'ffmpeg.exe') };
    progress('Checking yt-dlp, FFmpeg and ffprobe…'); await new YtDlpDownloader(stagedPaths).check(signal);
    const hashes: Record<string, string> = {}; for (const file of files) hashes[file] = await sha256(path.join(stage, file), signal);
    await fs.unlink(archive); await removeOwned(path.join(stage, prefix, 'bin'), stage); // Retain upstream docs, licenses and build notices.
    const manifest: Manifest = { schemaVersion: 1, release, versions: { ytDlp: toolSpec.ytDlp.version, ffmpeg: toolSpec.ffmpeg.version }, hashes, origins: toolSpec };
    await fs.writeFile(path.join(stage, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
    signal.throwIfAborted();
    await fs.writeFile(pointerTemp, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx', flush: true }); await absentOrPlain(path.join(root, 'current.json')); await fs.rename(pointerTemp, path.join(root, 'current.json')); promoted = true;
    progress('Verified tools ready. No media library was changed.');
    return { ytDlp: path.join(stage, 'yt-dlp.exe'), ffmpeg: path.join(stage, 'ffmpeg.exe') };
  } finally {
    // Only remove this invocation's UUID staging directory; preserve previous installations.
    if (!promoted) await removeOwned(stage, root);
    await fs.unlink(pointerTemp).catch(() => {}); await fs.unlink(lock);
  }
}
