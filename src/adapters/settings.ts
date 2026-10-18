import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { UserError } from '../domain/catalogue.js';
export interface Settings { schemaVersion: 1; libraryRoot: string; ytDlp: string; ffmpeg: string; }
export const settingsFile = () => path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'), 'SourceSpool', 'settings.json');
export async function readSettings(file = settingsFile()): Promise<Settings | null> {
  try {
    const stat = await fs.lstat(file); if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 16384) throw new UserError('Invalid settings file. Choose a library explicitly with --library.');
    const value = JSON.parse(await fs.readFile(file, 'utf8')) as Settings;
    if (value.schemaVersion !== 1 || ![value.libraryRoot, value.ytDlp, value.ffmpeg].every(s => typeof s === 'string' && !!s && s.length < 4096 && !/[\x00-\x1f]/.test(s)) || !path.isAbsolute(value.libraryRoot)) throw new UserError('Invalid settings. Select a library explicitly with --library.');
    return value;
  } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; if (error instanceof UserError) throw error; throw new UserError('Settings could not be read. Select a library explicitly with --library.'); }
}
export async function writeSettings(value: Settings, file = settingsFile()): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const info = await fs.lstat(path.dirname(file)); if (info.isSymbolicLink()) throw new UserError('The settings folder cannot be a link.');
  const existing = await fs.lstat(file).catch(error => { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; });
  if (existing?.isSymbolicLink()) throw new UserError('The settings file cannot be a link.');
  const temp = path.join(path.dirname(file), `.settings-${randomUUID()}.tmp`); const handle = await fs.open(temp, 'wx');
  try { await handle.writeFile(JSON.stringify(value, null, 2) + '\n'); await handle.sync(); } finally { await handle.close(); }
  try { await fs.rename(temp, file); } finally { await fs.unlink(temp).catch(() => {}); }
}
