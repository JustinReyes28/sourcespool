import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { LocalLibrary } from '../src/adapters/local-library.js';
import { YtDlpDownloader, runProcess } from '../src/adapters/downloader.js';
import { LibraryService } from '../src/application/library-service.js';
import { temporaryLibrary } from './helpers.js';
import { searchCatalogue } from '../src/domain/catalogue.js';
import type { Draft, Metadata } from '../src/domain/model.js';

const ytDlp = process.env.SOURCESPOOL_YTDLP;
const ffmpeg = process.env.SOURCESPOOL_FFMPEG;
if (!ytDlp || !ffmpeg) throw new Error('Set SOURCESPOOL_YTDLP and SOURCESPOOL_FFMPEG to the explicit installed tool executables before integration testing.');
const downloader = new YtDlpDownloader({ ytDlp, ffmpeg });
const callbacks = { progress() {}, async duplicate() { return 'another' as const; } };
const makeDraft = (meta: Metadata, collectionId: string, notes: string): Draft => ({ sourceUrl: meta.sourceUrl, formatId: meta.formats[0]!.id, collectionId, tags: 'original, sample', notes });

test('real yt-dlp/FFmpeg saves three original HTTP media items into two collections and restores metadata', { timeout: 120000 }, async () => {
  const temp = await temporaryLibrary(); const imported = await temporaryLibrary();
  const source = path.join(temp.directory, 'http-source'); await fs.mkdir(source);
  const server = createServer(async (request, response) => {
    try {
      const name = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname).slice(1);
      if (!/^[a-zA-Z0-9_.-]+$/.test(name)) { response.writeHead(404).end(); return; }
      const contents = await fs.readFile(path.join(source, name));
      response.writeHead(200, { 'content-type': name.endsWith('.mpd') ? 'application/dash+xml' : name.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream', 'content-length': contents.length }); response.end(contents);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as { port: number }).port;
  try {
    const versions = await downloader.check(); assert.match(versions.ytDlp, /^2026\.08\.19$/); assert.match(versions.ffmpeg, /9\.0\.2/);
    for (const [index, color] of ['blue', 'red', 'green'].entries()) {
      await runProcess(ffmpeg!, ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', `color=c=${color}:s=160x90:r=12:d=1`, '-f', 'lavfi', '-i', `sine=frequency=${440 + index * 110}:duration=1`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', '-movflags', '+faststart', path.join(source, `sample-${index}.mp4`)], AbortSignal.timeout(20000));
    }
    const service = new LibraryService(temp.library, downloader);
    const media: Metadata[] = [];
    for (let index = 0; index < 3; index++) {
      const meta = await service.inspect(`http://127.0.0.1:${port}/sample-${index}.mp4`, AbortSignal.timeout(30000)); media.push(meta);
      const result = await service.save(makeDraft(meta, index === 2 ? 'studio' : 'field-notes', index === 0 ? 'Find reflections in this original sample.' : `Sample ${index}`), meta, AbortSignal.timeout(30000), callbacks);
      assert.equal(await temp.library.status(result.item), 'present');
      const probe = await runProcess(path.join(path.dirname(ffmpeg!), 'ffprobe.exe'), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', await temp.library.guard(result.item.relativePath)], AbortSignal.timeout(10000));
      assert.ok(Number((JSON.parse(probe) as { format: { duration: string } }).format.duration) > 0.5);
    }
    const saved = await temp.library.read(); assert.equal(saved.items.length, 3); assert.equal(new Set(saved.items.map(i => i.collectionId)).size, 2);
    assert.equal(searchCatalogue(saved.items, 'reflections').length, 1);
    const repeat = media[0]!; const reasons: string[] = [];
    await service.save(makeDraft(repeat, 'field-notes', 'Repeat'), repeat, AbortSignal.timeout(30000), { progress() {}, async duplicate(_item, reason) { reasons.push(reason); return 'existing'; } });
    assert.deepEqual(reasons, ['source']); assert.equal((await temp.library.read()).items.length, 3);
    const exported = path.join(temp.directory, 'metadata-export.json'); await temp.library.exportTo(exported);
    const preview = await imported.library.importPreview(exported); assert.equal(preview.missing, 3);
    await imported.library.importCatalogue(preview.incoming, 'keep'); assert.deepEqual((await imported.library.read()).items, saved.items);
    const reopened = new LocalLibrary(temp.directory); await reopened.initialize(); assert.equal((await reopened.read()).items.length, 3);
    await fs.writeFile(path.resolve('.tmp/real-media-evidence.json'), JSON.stringify({ measuredAt: new Date().toISOString(), versions, samples: saved.items.map(i => ({ title: i.title, bytes: i.bytes, hash: i.hash, collection: i.collectionId })), task: '3 original generated clips / 2 collections / note search / duplicate / export / import', result: 'pass', source: 'Original color and sine fixtures generated with FFmpeg; served over HTTP on loopback. No public-site reliability claim.' }, null, 2));
  } finally { server.closeAllConnections(); await new Promise<void>(r => server.close(() => r())); await temp.cleanup(); await imported.cleanup(); }
});

test('real separate video/audio DASH selection merges through FFmpeg and exposes audio format', { timeout: 90000 }, async () => {
  const temp = await temporaryLibrary(); const source = path.join(temp.directory, 'dash'); await fs.mkdir(source);
  const server = createServer(async (request, response) => {
    try {
      const name = new URL(request.url ?? '/', 'http://localhost').pathname.slice(1);
      if (!/^[a-zA-Z0-9_.-]+$/.test(name)) { response.writeHead(404).end(); return; }
      const contents = await fs.readFile(path.join(source, name)); response.writeHead(200, { 'content-type': name.endsWith('.mpd') ? 'application/dash+xml' : 'application/octet-stream', 'content-length': contents.length }); response.end(contents);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve)); const port = (server.address() as { port: number }).port;
  try {
    await runProcess(ffmpeg!, ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=purple:s=160x90:r=12:d=2', '-f', 'lavfi', '-i', 'sine=frequency=660:duration=2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', '-f', 'dash', path.join(source, 'manifest.mpd').split(path.sep).join('/')], AbortSignal.timeout(20000));
    const service = new LibraryService(temp.library, downloader); const meta = await service.inspect(`http://127.0.0.1:${port}/manifest.mpd`, AbortSignal.timeout(30000));
    assert.ok(meta.formats.some(f => f.id.includes('+'))); assert.ok(meta.formats.some(f => f.label.startsWith('Audio')));
    const selected = meta.formats.find(f => f.id.includes('+'))!;
    const result = await service.save({ ...makeDraft(meta, 'studio', 'Merged original sample'), formatId: selected.id }, meta, AbortSignal.timeout(30000), callbacks);
    assert.ok(result.item.relativePath.endsWith('.mkv')); assert.equal(await temp.library.status(result.item), 'present');
    const probe = JSON.parse(await runProcess(path.join(path.dirname(ffmpeg!), 'ffprobe.exe'), ['-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'json', await temp.library.guard(result.item.relativePath)], AbortSignal.timeout(10000))) as { streams: { codec_type: string }[] };
    assert.deepEqual(probe.streams.map(s => s.codec_type).sort(), ['audio', 'video']);
    const audio = meta.formats.find(f => f.label.startsWith('Audio'))!;
    const audioResult = await service.save({ ...makeDraft(meta, 'studio', 'Original audio sample'), formatId: audio.id }, meta, AbortSignal.timeout(30000), callbacks);
    assert.equal(await temp.library.status(audioResult.item), 'present');
  } finally { server.closeAllConnections(); await new Promise<void>(r => server.close(() => r())); await temp.cleanup(); }
});

test('Windows cancellation stops a real child-process tree and settles before returning', { timeout: 20000 }, async () => {
  const temp = await temporaryLibrary(); const pidFile = path.join(temp.directory, 'descendant.pid'); const script = path.join(temp.directory, 'parent.mjs');
  await fs.writeFile(script, `import {spawn} from 'node:child_process';import {writeFileSync} from 'node:fs';const c=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{windowsHide:true,stdio:'ignore'});writeFileSync(process.argv[2],String(c.pid));setInterval(()=>{},1000);`);
  const abort = new AbortController(); const running = runProcess(process.execPath, [script, pidFile], abort.signal); running.catch(() => {});
  try {
    for (let i = 0; i < 100; i++) { if (await fs.stat(pidFile).then(() => true).catch(() => false)) break; await delay(30); }
    const pid = Number(await fs.readFile(pidFile, 'utf8')); assert.ok(pid > 0); process.kill(pid, 0);
    abort.abort(); await assert.rejects(running, { name: 'AbortError' });
    assert.throws(() => process.kill(pid, 0));
  } finally { abort.abort(); await temp.cleanup(); }
});

test('a forcibly killed Windows writer leaves a recoverable lock and commit journal', { timeout: 20000 }, async () => {
  const temp = await temporaryLibrary(); const marker = path.join(temp.directory, 'promoted.marker'); const script = path.join(temp.directory, 'crash-writer.mjs');
  const libraryModule = new URL('../dist/adapters/local-library.js', import.meta.url).href;
  const itemModule = new URL('../dist/domain/catalogue.js', import.meta.url).href;
  await fs.writeFile(script, `import {LocalLibrary} from ${JSON.stringify(libraryModule)};import {writeFile} from 'node:fs/promises';import {randomUUID,createHash} from 'node:crypto';import path from 'node:path';const root=process.argv[2];const marker=process.argv[3];const l=new LocalLibrary(root,{async afterPromotion(){await writeFile(marker,'ready');await new Promise(()=>{});}});const s=await l.createStaging();const file=path.join(s.directory,'media.mp4');await writeFile(file,'forced interruption');const item={id:randomUUID(),sourceUrl:'https://example.org/crash.mp4',title:'Crash sample',sourceIdentity:{extractor:'test',sourceId:'crash',formatId:'mp4'},createdAt:new Date().toISOString(),relativePath:'studio/crash.mp4',bytes:19,hash:createHash('sha256').update('forced interruption').digest('hex'),tags:[],notes:'Original interruption fixture',collectionId:'studio'};await l.commitFile(item,file,s.job,false,new AbortController().signal,()=>{});setInterval(()=>{},1000);`);
  // A live timer keeps the process alive while deliberately pausing after promotion.
  await fs.writeFile(script, 'setInterval(()=>{},1000);\n' + await fs.readFile(script, 'utf8'));
  const child = spawn(process.execPath, [script, temp.directory, marker], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }); let errors = ''; child.stderr.on('data', chunk => { errors += String(chunk); });
  try {
    for (let i = 0; i < 150; i++) { if (await fs.stat(marker).then(() => true).catch(() => false)) break; if (child.exitCode !== null) throw new Error(errors); await delay(30); }
    assert.equal(await fs.readFile(marker, 'utf8'), 'ready'); child.kill('SIGKILL'); await new Promise<void>(resolve => child.once('close', () => resolve())); await delay(2100);
    assert.equal((await temp.library.lockStatus())!.alive, false); await assert.rejects(temp.library.initialize(), /locked/);
    await temp.library.releaseStaleLock(); const pending = await temp.library.recovery(); assert.equal(pending[0]!.state, 'ready');
    await temp.library.recover(pending[0]!.job, 'recover'); assert.equal((await temp.library.read()).items.length, 1);
  } finally { if (child.exitCode === null) child.kill('SIGKILL'); await temp.cleanup(); }
});

test('cancelling an actual yt-dlp HTTP download leaves no completed record or staged file', { timeout: 45000 }, async () => {
  const temp = await temporaryLibrary(); const source = path.join(temp.directory, 'slow.mp4');
  await runProcess(ffmpeg!, ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=24:duration=3', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', source], AbortSignal.timeout(20000));
  const contents = await fs.readFile(source); let watching = false; let downloading!: () => void; const reached = new Promise<void>(resolve => { downloading = resolve; });
  const timers = new Set<ReturnType<typeof setInterval>>();
  const server = createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'video/mp4', 'content-length': contents.length });
    if (request.method === 'HEAD') { response.end(); return; }
    if (watching) downloading(); let offset = 0;
    const timer = setInterval(() => { response.write(contents.subarray(offset, offset + 1024)); offset += 1024; if (offset >= contents.length) { clearInterval(timer); timers.delete(timer); response.end(); } }, 50); timers.add(timer);
    response.on('close', () => { clearInterval(timer); timers.delete(timer); });
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve)); const port = (server.address() as { port: number }).port;
  const abort = new AbortController();
  try {
    const service = new LibraryService(temp.library, downloader); const meta = await service.inspect(`http://127.0.0.1:${port}/slow.mp4`, AbortSignal.timeout(20000));
    watching = true; const running = service.save(makeDraft(meta, 'field-notes', 'Cancel this original sample'), meta, abort.signal, callbacks); running.catch(() => {});
    await reached; await delay(100); abort.abort(); await assert.rejects(running, { name: 'AbortError' });
    assert.equal((await temp.library.read()).items.length, 0); assert.deepEqual(await fs.readdir(path.join(temp.directory, '.staging')), []);
  } finally { abort.abort(); for (const timer of timers) clearInterval(timer); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); await temp.cleanup(); }
});

test('tool absence and source/format/network/disk failures have actionable public messages', async () => {
  const absent = new YtDlpDownloader({ ytDlp: 'C:/missing-sourcespool-tool/yt-dlp.exe', ffmpeg: ffmpeg! });
  await assert.rejects(absent.check(), /missing|installed executable/);
  for (const [diagnostic, expected] of [
    ['Requested format is not available', /another format/],
    ['unable to download: network connection timed out', /connection/],
    ['sign in required: HTTP 403', /authentication|denies access/],
    ['No space left on device', /disk is full/]
  ] as const) {
    await assert.rejects(runProcess(process.execPath, ['-e', 'process.stderr.write(process.argv[1]);process.exit(2)', diagnostic], new AbortController().signal), expected);
  }
});
