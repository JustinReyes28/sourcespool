import { spawn } from 'node:child_process';
import path from 'node:path';
import { MEDIA_EXTENSIONS, sourceUrl, UserError } from '../domain/catalogue.js';
import type { Item } from '../domain/model.js';
import type { LocalLibrary } from './local-library.js';
/** The target is an argv value; PowerShell code is fixed and receives no interpolation. */
export async function openTarget(target: string): Promise<void> {
  if (process.platform !== 'win32') throw new UserError('Opening files and sources is supported on Windows only.');
  const executable = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  await new Promise<void>((resolve, reject) => {
    const child = spawn(executable, ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', 'try { Start-Process -FilePath $env:SOURCESPOOL_OPEN_TARGET -ErrorAction Stop } catch { exit 1 }'], { shell: false, windowsHide: true, stdio: 'ignore', env: { ...process.env, SOURCESPOOL_OPEN_TARGET: target } });
    child.on('error', reject); child.on('close', code => code === 0 ? resolve() : reject(new UserError('Windows could not open this item. Check its default application and try again.')));
  });
}
export async function openItem(library: LocalLibrary, item: Item, kind: 'file' | 'source'): Promise<void> {
  if (kind === 'source') return openTarget(sourceUrl(item.sourceUrl));
  if (!MEDIA_EXTENSIONS.has(path.extname(item.relativePath).slice(1).toLowerCase())) throw new UserError('Only supported audio/video file types can be opened. Open the source URL or inspect this imported record manually.');
  if (await library.status(item) !== 'present') throw new UserError(`The media file is missing or changed. Restore it at ${item.relativePath}; the source and notes are still available.`);
  const verified = await library.verify(await library.guard(item.relativePath));
  if (verified.sha256 !== item.hash || verified.bytes !== item.bytes) throw new UserError('The media file changed. Restore the verified file before opening it. Source and notes remain available.');
  await openTarget(await library.guard(item.relativePath));
}
