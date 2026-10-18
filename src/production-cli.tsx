import { render } from 'ink';
import { createInterface } from 'node:readline/promises';
import path from 'node:path';
import os from 'node:os';
import { ProductionApp } from './ui/production-app.js';
import { ApplicationController } from './application/controller.js';
import { LibraryService } from './application/library-service.js';
import { LocalLibrary } from './adapters/local-library.js';
import { YtDlpDownloader } from './adapters/downloader.js';
import { readSettings, writeSettings } from './adapters/settings.js';
import { UserError } from './domain/catalogue.js';

export const productionHelp = `SourceSpool — local media reference library

node dist/cli.js                        Open library (first run asks for a folder)
--library <directory>                   Use/create this local library
--yt-dlp <executable>                   Installed yt-dlp.exe path (or SOURCESPOOL_YTDLP)
--ffmpeg <executable>                   Installed ffmpeg.exe path; ffprobe sits beside it
--remember                             Save these paths to local settings
--check-tools                          Check tool versions; no library writes
--demo [--empty]                        Separate synthetic design walkthrough
--snapshot <state>                      Print a synthetic design sketch
--help                                 Show help
--version                              Show version

Windows 11 x64 / Node 24.19.0. Tested tools: yt-dlp 2026.08.19 / FFmpeg 9.0.2.
No automatic tool downloads. Exports contain metadata, not media. See README.`;

export async function runProduction(args: string[], options: { onFirstPaint?: (controller: ApplicationController) => void; onReady?: (controller: ApplicationController) => void } = {}): Promise<void> {
  if (args.includes('--version')) { console.log('SourceSpool 0.1.0'); return; }
  const allowed = new Set(['--library', '--yt-dlp', '--ffmpeg', '--remember', '--check-tools']);
  for (let i = 0; i < args.length; i++) { if (!allowed.has(args[i]!)) throw new UserError(`Unknown option: ${args[i]}. Use --help.`); if (['--library', '--yt-dlp', '--ffmpeg'].includes(args[i]!)) { if (!args[i + 1] || args[i + 1]!.startsWith('--')) throw new UserError(`Missing value for ${args[i]}.`); i++; } }
  if (!/^24\./.test(process.versions.node) || Number(process.versions.node.split('.')[1]) < 19) throw new UserError('Use supported Node 24.19.0 or a later Node 24 patch. Node 25 is outside the tested support range.');
  if (process.platform !== 'win32' || process.arch !== 'x64') throw new UserError('This release supports Windows 11 x64 with local NTFS storage.');
  const option = (name: string) => { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; };
  let saved = null;
  try { saved = await readSettings(); } catch (error) { if (!option('--library') && !args.includes('--check-tools')) throw error; }
  const paths = { ytDlp: option('--yt-dlp') ?? process.env.SOURCESPOOL_YTDLP ?? saved?.ytDlp ?? 'yt-dlp.exe', ffmpeg: option('--ffmpeg') ?? process.env.SOURCESPOOL_FFMPEG ?? saved?.ffmpeg ?? 'ffmpeg.exe' };
  const downloader = new YtDlpDownloader(paths);
  if (args.includes('--check-tools')) { console.log(JSON.stringify(await downloader.check(), null, 2)); return; }
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new UserError('Open SourceSpool in Windows Terminal or PowerShell. Use --check-tools for a noninteractive dependency check.');
  let libraryRoot = option('--library') ?? saved?.libraryRoot;
  let remember = args.includes('--remember');
  if (!libraryRoot) {
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    try {
      const suggested = path.join(os.homedir(), 'Videos', 'SourceSpool');
      const answer = (await prompt.question(`Choose a writable local NTFS library folder [${suggested}]: `)).trim(); libraryRoot = path.resolve(answer || suggested);
      const confirm = await prompt.question(`Create/open ${libraryRoot} and remember this location? [y/N] `);
      if (confirm.toLowerCase() !== 'y') { console.log('No library was opened.'); return; } remember = true;
    } finally { prompt.close(); }
  }
  if (libraryRoot.startsWith('\\\\')) throw new UserError('Choose a local NTFS folder. Network shares are unsupported.');
  const library = new LocalLibrary(libraryRoot); const controller = new ApplicationController(new LibraryService(library, downloader));
  await controller.initialize(false);
  if (remember && !controller.state.error) await writeSettings({ schemaVersion: 1, libraryRoot: library.root, ...paths });
  const instance = render(<ProductionApp controller={controller} />, { exitOnCtrlC: false });
  const signal = () => controller.cancel(true); process.on('SIGINT', signal); process.on('SIGTERM', signal);
  try {
    await instance.waitUntilRenderFlush(); options.onFirstPaint?.(controller);
    if (!controller.state.exitRequested && !controller.state.error) void controller.checkTools().then(() => options.onReady?.(controller));
    else options.onReady?.(controller);
    await instance.waitUntilExit();
  }
  finally { controller.cancel(); await controller.waitForIdle(); instance.unmount(); process.off('SIGINT', signal); process.off('SIGTERM', signal); }
  if (controller.state.exitRequested && controller.state.page === 'completed') console.log(controller.state.notice);
  if (controller.state.exitRequested && controller.state.page === 'failure') { console.error(controller.state.error); process.exitCode = 1; }
}
