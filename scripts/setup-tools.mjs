// Explicit developer/user command; never invoked by application startup or npm install.
import { createWriteStream, createReadStream } from 'node:fs';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
export const toolVersions = { ytDlp: '2026.08.19', ffmpeg: '9.0.2' };
export async function installTools(destination = fileURLToPath(new URL('../.tools/', import.meta.url))) {
  if (process.platform !== 'win32') throw Error('This helper installs Windows x64 tools only.');
  const root = path.resolve(destination); await fs.mkdir(root, { recursive: true });
  if ((await fs.lstat(root)).isSymbolicLink()) throw Error('Tool directory cannot be a link.');
  async function download(url, name) {
    const file = path.join(root, name); const info = await fs.lstat(file).catch(e => { if (e.code === 'ENOENT') return null; throw e; });
    if (info?.isSymbolicLink()) throw Error('Tool file cannot be a link.');
    const response = await fetch(url, { signal: AbortSignal.timeout(180000) });
    if (!response.ok || !response.body) throw Error(`Download failed: HTTP ${response.status}`);
    const temp = file + '.download'; const tempInfo = await fs.lstat(temp).catch(() => null); if (tempInfo) throw Error('A partial tool download exists. Inspect and remove it before retrying.');
    await pipeline(Readable.fromWeb(response.body), createWriteStream(temp, { flags: 'wx' })); await fs.rename(temp, file); return file;
  }
  async function sha256(file) { const hash = createHash('sha256'); for await (const chunk of createReadStream(file)) hash.update(chunk); return hash.digest('hex'); }
  const sums = await download(`https://github.com/yt-dlp/yt-dlp/releases/download/${toolVersions.ytDlp}/SHA2-256SUMS`, 'yt-dlp-SHA256SUMS');
  const unverifiedYt = await download(`https://github.com/yt-dlp/yt-dlp/releases/download/${toolVersions.ytDlp}/yt-dlp.exe`, 'yt-dlp.exe.unverified');
  const expectedYt = (await fs.readFile(sums, 'utf8')).split('\n').find(line => /\s+yt-dlp\.exe\s*$/.test(line))?.trim().split(/\s+/)[0];
  if (!expectedYt || await sha256(unverifiedYt) !== expectedYt) throw Error('yt-dlp checksum mismatch. Do not run the file.');
  const yt = path.join(root, 'yt-dlp.exe');
  const priorYt = await fs.lstat(yt).catch(e => { if (e.code === 'ENOENT') return null; throw e; });
  if (priorYt?.isSymbolicLink()) throw Error('Installed tool cannot be a link.');
  await fs.rename(unverifiedYt, yt);
  const base = `https://www.gyan.dev/ffmpeg/builds/packages/ffmpeg-${toolVersions.ffmpeg}-essentials_build.zip`;
  const checksum = await download(base + '.sha256', 'ffmpeg.sha256'); const archive = await download(base, 'ffmpeg.zip');
  const expectedFf = (await fs.readFile(checksum, 'utf8')).trim().split(/\s+/)[0];
  if (!expectedFf || await sha256(archive) !== expectedFf) throw Error('FFmpeg checksum mismatch. Do not extract or run the archive.');
  const prefix = `ffmpeg-${toolVersions.ffmpeg}-essentials_build/`;
  const entries = (await run('tar.exe', ['-tf', archive])).stdout.split(/\r?\n/).filter(Boolean);
  if (entries.some(entry => !entry.startsWith(prefix) || entry.split('/').includes('..') || /[:\\]/.test(entry))) throw Error('Unexpected archive paths. Extraction refused.');
  const extraction = path.join(root, prefix); const existing = await fs.lstat(extraction).catch(e => { if (e.code === 'ENOENT') return null; throw e; });
  if (existing) throw Error('FFmpeg extraction directory already exists. Reuse it or inspect it before reinstalling.');
  await run('tar.exe', ['-xf', archive, '-C', root]);
  const ffmpeg = path.join(extraction, 'bin', 'ffmpeg.exe');
  const manifest = { versions: toolVersions, installedAt: new Date().toISOString(), ytDlp: { sha256: expectedYt, url: `https://github.com/yt-dlp/yt-dlp/releases/tag/${toolVersions.ytDlp}` }, ffmpeg: { sha256: expectedFf, url: base }, bundledInSourceSpool: false };
  await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Verified tools installed. Start SourceSpool with:\nnode dist/cli.js --yt-dlp "${yt}" --ffmpeg "${ffmpeg}" --remember`);
  return { ytDlp: yt, ffmpeg };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) installTools().catch(error => { console.error(error.message); process.exitCode = 1; });
