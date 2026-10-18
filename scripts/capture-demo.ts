import * as fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'node:http';
import { PassThrough, Writable } from 'node:stream';
import { setTimeout as delay } from 'node:timers/promises';
import { createElement, act } from 'react';
import { render } from 'ink';
import { LocalLibrary } from '../src/adapters/local-library.js';
import { YtDlpDownloader, runProcess } from '../src/adapters/downloader.js';
import { LibraryService } from '../src/application/library-service.js';
import { ApplicationController } from '../src/application/controller.js';
import { ProductionApp } from '../src/ui/production-app.js';
import { appVersion } from '../src/version.js';

const ytDlp = process.env.SOURCESPOOL_YTDLP; const ffmpeg = process.env.SOURCESPOOL_FFMPEG;
if (!ytDlp || !ffmpeg) throw Error('Set explicit tool paths before recording the production demo.');
const base = path.resolve('.tmp'); await fs.mkdir(base, { recursive: true }); const directory = await fs.mkdtemp(path.join(base, 'demo-'));
const library = new LocalLibrary(path.join(directory, 'library')); const output = path.resolve('docs/demo'); await fs.mkdir(output, { recursive: true });
const source = path.join(directory, 'prism-study.mp4');
await runProcess(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=24:duration=2', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', '-movflags', '+faststart', source], AbortSignal.timeout(30000));
const bytes = await fs.readFile(source);
const server = createServer((request, response) => { if (request.url !== '/prism-study.mp4') { response.writeHead(404).end(); return; } response.writeHead(200, { 'content-type': 'video/mp4', 'content-length': bytes.length }); response.end(request.method === 'HEAD' ? undefined : bytes); });
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve)); const url = `http://127.0.0.1:${(server.address() as { port: number }).port}/prism-study.mp4`;
const controller = new ApplicationController(new LibraryService(library, new YtDlpDownloader({ ytDlp, ffmpeg }))); await controller.initialize();
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const chunks: string[] = [];
const stdin = Object.assign(new PassThrough(), { isTTY: true, isRaw: false, setRawMode(value: boolean) { this.isRaw = value; return this; } });
const stdout = Object.assign(new Writable({ write(chunk, _encoding, callback) { chunks.push(String(chunk)); callback(); } }), { isTTY: true, columns: 96, rows: 32 });
let instance!: ReturnType<typeof render>;
await act(async () => { instance = render(createElement(ProductionApp, { controller }), { stdin, stdout, stderr: stdout, debug: true, interactive: true, patchConsole: false, exitOnCtrlC: false }); });
async function key(value: string, wait = false) {
  await act(async () => { stdin.write(value); if (value === '\u001b') await delay(60); await delay(10); if (wait) await controller.waitForIdle(); }); await instance.waitUntilRenderFlush();
}
const frames: { name: string; caption: string; text: string; page: string }[] = [];
const redact = (text: string, absolute: string, label: string) => text.replace(new RegExp([...absolute].map(character => character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(?:\\r?\\n\\s*)?'), 'gi'), label);
function capture(name: string, caption: string) {
  const frame = chunks.filter(s => s.includes('SourceSpool / local media library')).at(-1); if (!frame) throw Error('No rendered Ink frame captured.');
  const text = redact(redact(redact(frame.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '').replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, '').replace(/\r/g, ''), library.root, 'C:\\SourceSpool-demo'), directory, '<demo-output>'), path.relative(process.cwd(), directory), '<demo-output>');
  if (text.includes('Administrator') || text.includes('Documents\\Projects')) throw Error('Unredacted machine path in demo capture.');
  frames.push({ name, caption, text, page: controller.state.page });
}
try {
  await key('a'); await key(url); await key('\r', true); await key('\r'); await key('light, reference'); await key('\t'); await key('Look at the reflections.');
  capture('01-context', 'Add source context before saving');
  await key('\r'); capture('02-review', 'Review the same naming path used for the save');
  await key('\r', true); if (controller.state.page !== 'completed') throw Error(controller.state.error || 'Real save did not complete.');
  capture('03-saved', 'Real yt-dlp download, SHA-256 verification and catalogue commit');
  await key('\r'); await key('reflections'); capture('04-search', 'Find the saved reference by its note');
  await key('\u001b'); await key('a'); await key('\r', true); await key('\r'); await key('\r'); await key('\r'); await act(async () => { await delay(100); }); await instance.waitUntilRenderFlush();
  if (controller.snapshot().page !== 'duplicate') throw Error('Expected actual source/format duplicate preflight.'); capture('05-duplicate', 'Choose deliberately when the source is already saved');
  await key('k', true); await key('\u001b'); await key('e'); await key(path.relative(process.cwd(), path.join(directory, 'metadata-export.json'))); await key('\r');
  await act(async () => {
    const deadline = Date.now() + 5000;
    while (!controller.state.notice.startsWith('Catalogue exported.')) {
      if (controller.state.error || Date.now() > deadline) throw Error(controller.state.error || 'Metadata export did not complete.');
      await delay(10);
    }
  });
  await instance.waitUntilRenderFlush();
  capture('06-export', 'Export portable metadata; back up the media tree separately');
  const exportEnvelope = JSON.parse(await fs.readFile(path.join(directory, 'metadata-export.json'), 'utf8')) as { items: unknown[] }; if (exportEnvelope.items.length !== 1) throw Error('Unexpected export count.');
  await fs.writeFile(path.join(output, 'frames.json'), JSON.stringify({ recordedAt: new Date().toISOString(), version: appVersion, source: 'Actual production Ink render captured from the development checkout in a keyboard-driven session using real yt-dlp/FFmpeg and original generated media over loopback HTTP. Library/export paths redacted; timings editorially condensed.', frames, observations: { savedRecords: controller.state.catalogue.items.length, exportedRecords: exportEnvelope.items.length, noFixtureSimulator: true } }, null, 2) + '\n');
  console.log(`Recorded ${frames.length} production frames.`);
} finally {
  await act(async () => { controller.cancel(); await controller.waitForIdle(); instance.unmount(); }); stdin.destroy(); stdout.destroy(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
  const relative = path.relative(base, directory); if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || (await fs.lstat(directory)).isSymbolicLink()) throw Error('Unsafe demo cleanup target');
  await fs.rm(directory, { recursive: true, force: true });
}
