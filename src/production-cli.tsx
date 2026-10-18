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
import { appVersion } from './version.js';
import { installTools, readManagedTools, toolSpec, toolsRoot } from './adapters/tool-setup.js';

export const productionHelp = `SourceSpool — local media reference library

sourcespool                            Open library (first run offers setup)
npx sourcespool                        Run the published package
--setup                                Set up tools without opening a library
--tool-cache <folder>                   Reuse verified yt-dlp.exe and ffmpeg.zip
--download-tools                       Explicitly download tools (with --setup)
--repair                               Install a fresh verified managed tool set
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
Tools download only after an explicit install choice (~133 MB). Cached files are reused.
Update: npm install -g sourcespool@latest; remove: npm uninstall -g sourcespool.
Settings/tools and your separate media library survive uninstall. Exports contain metadata.`;

export async function runProduction(args: string[], options: { onFirstPaint?: (controller: ApplicationController) => void; onReady?: (controller: ApplicationController) => void } = {}): Promise<void> {
  if (args.includes('--version')) { console.log('SourceSpool ' + appVersion); return; }
  const allowed = new Set(['--library', '--yt-dlp', '--ffmpeg', '--remember', '--check-tools', '--setup', '--tool-cache', '--download-tools', '--repair']);
  for (let i = 0; i < args.length; i++) { if (!allowed.has(args[i]!)) throw new UserError(`Unknown option: ${args[i]}. Use --help.`); if (['--library', '--yt-dlp', '--ffmpeg', '--tool-cache'].includes(args[i]!)) { if (!args[i + 1] || args[i + 1]!.startsWith('--')) throw new UserError(`Missing value for ${args[i]}.`); i++; } }
  if (!/^24\./.test(process.versions.node) || Number(process.versions.node.split('.')[1]) < 19) throw new UserError('Use supported Node 24.19.0 or a later Node 24 patch. Node 25 is outside the tested support range.');
  if (process.platform !== 'win32' || process.arch !== 'x64') throw new UserError('This release supports Windows 11 x64 with local NTFS storage.');
  const option = (name: string) => { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; };
  let saved = null;
  try { saved = await readSettings(); } catch (error) { if (!option('--library') && !args.includes('--check-tools') && !args.includes('--setup')) throw error; }
  if (args.includes('--download-tools') && !args.includes('--setup')) throw new UserError('Use --setup --download-tools to explicitly install tools.');
  if (args.includes('--setup') && args.includes('--check-tools')) throw new UserError('Choose --setup or --check-tools.');
  const setup = async () => {
    const abort = new AbortController(); const cancel = () => abort.abort(); process.once('SIGINT', cancel); process.once('SIGTERM', cancel);
    try {
      let cache = option('--tool-cache'); let download = args.includes('--download-tools'); const repair = args.includes('--repair');
      if (!cache && !download && !repair) {
        const managed = await readManagedTools(); if (managed) { await new YtDlpDownloader(managed).check(abort.signal); console.log('Reusing verified managed tools; no download.'); return managed; }
      }
      if (!cache && !download) {
        if (!process.stdin.isTTY || !process.stdout.isTTY) throw new UserError('Run sourcespool --setup in an interactive terminal, or supply --tool-cache <folder> for offline setup. No download was started.');
        const prompt = createInterface({ input: process.stdin, output: process.stdout });
        try {
          const source = (await prompt.question('Existing downloads folder containing yt-dlp.exe and ffmpeg.zip (Enter to see download choice): ', { signal: abort.signal })).trim();
          if (source) cache = source;
          else {
            console.log('Install yt-dlp ' + toolSpec.ytDlp.version + ' and FFmpeg/ffprobe ' + toolSpec.ffmpeg.version + '.');
            console.log('Download: about 133 MB; allow 800 MB free disk space. Hosts: github.com and gyan.dev.');
            console.log('Destination: ' + toolsRoot() + '\nExternal tools retain GPLv3+ licenses/notices: https://github.com/JustinReyes28/sourcespool/blob/main/docs/tool-provenance.md');
            download = (await prompt.question('Download and install these verified tools? [y/N] ', { signal: abort.signal })).trim().toLowerCase() === 'y';
            if (!download) { console.log('Setup cancelled. No tools downloaded; no library opened.'); return null; }
          }
        } finally { prompt.close(); }
      }
      if (cache && download) throw new UserError('Choose --tool-cache or --download-tools; a cache failure never falls back to network.');
      return await installTools({ ...(cache ? { sourceDirectory: cache } : {}), allowDownload: download, repair, signal: abort.signal, progress: console.log });
    } finally { process.removeListener('SIGINT', cancel); process.removeListener('SIGTERM', cancel); }
  };
  if (args.includes('--setup')) { await setup(); return; }
  let managed = null;
  const explicit = { ytDlp: option('--yt-dlp') ?? process.env.SOURCESPOOL_YTDLP ?? saved?.ytDlp, ffmpeg: option('--ffmpeg') ?? process.env.SOURCESPOOL_FFMPEG ?? saved?.ffmpeg };
  if (!explicit.ytDlp || !explicit.ffmpeg) managed = await readManagedTools();
  let paths = { ytDlp: explicit.ytDlp ?? managed?.ytDlp ?? 'yt-dlp.exe', ffmpeg: explicit.ffmpeg ?? managed?.ffmpeg ?? 'ffmpeg.exe' };
  let downloader = new YtDlpDownloader(paths);
  if (args.includes('--check-tools')) { console.log(JSON.stringify({ paths, versions: await downloader.check() }, null, 2)); return; }
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new UserError('Open SourceSpool in Windows Terminal or PowerShell. Use --setup for dependency setup or --check-tools for a noninteractive check.');
  try { await downloader.check(); }
  catch (error) {
    console.log(error instanceof Error ? error.message : 'Tools could not be checked.');
    if (explicit.ytDlp || explicit.ffmpeg) throw new UserError('Check your explicit tool paths, or run sourcespool --setup --repair. Existing executables were not changed.');
    const prompt = createInterface({ input: process.stdin, output: process.stdout }); let consent = false;
    try { consent = (await prompt.question('Open guided tool setup? [y/N] ')).trim().toLowerCase() === 'y'; } finally { prompt.close(); }
    if (!consent) { console.log('No library was opened. Run sourcespool --setup when ready.'); return; }
    const installed = await setup(); if (!installed) return; paths = installed; downloader = new YtDlpDownloader(paths);
  }
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
