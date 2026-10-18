import * as fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import assert from 'node:assert/strict';
const run = promisify(execFile);
export async function verifyInstalledMedia({ prefix, work, tools, library }) {
  const moduleAt = file => pathToFileURL(path.join(prefix, 'node_modules', 'sourcespool', 'dist', file)).href;
  const { LocalLibrary } = await import(moduleAt('adapters/local-library.js'));
  const { YtDlpDownloader } = await import(moduleAt('adapters/downloader.js'));
  const { LibraryService } = await import(moduleAt('application/library-service.js'));
  const { searchCatalogue } = await import(moduleAt('domain/catalogue.js'));
  const sample = path.join(work, 'original-installed-test.mp4');
  await run(path.join(tools, 'ffmpeg.exe'), ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=blue:s=160x90:r=12:d=1', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', '-movflags', '+faststart', sample], { windowsHide: true });
  const dash = path.join(work, 'dash'); await fs.mkdir(dash);
  await run(path.join(tools, 'ffmpeg.exe'), ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=purple:s=160x90:r=12:d=2', '-f', 'lavfi', '-i', 'sine=frequency=660:duration=2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', '-f', 'dash', path.join(dash, 'manifest.mpd').split(path.sep).join('/')], { windowsHide: true });
  const server = createServer(async (request, response) => {
    try {
      const name = new URL(request.url, 'http://localhost').pathname.slice(1); if (!/^[a-zA-Z0-9_.-]+$/.test(name)) throw Error();
      const bytes = await fs.readFile(name === 'original.mp4' ? sample : path.join(dash, name));
      response.writeHead(200, { 'content-type': name.endsWith('.mpd') ? 'application/dash+xml' : 'video/mp4', 'content-length': bytes.length }).end(bytes);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const local = new LocalLibrary(library); await local.initialize();
    const service = new LibraryService(local, new YtDlpDownloader({ ytDlp: path.join(tools, 'yt-dlp.exe'), ffmpeg: path.join(tools, 'ffmpeg.exe') }));
    const url = 'http://127.0.0.1:' + server.address().port + '/original.mp4';
    const metadata = await service.inspect(url, AbortSignal.timeout(30000));
    const draft = { sourceUrl: url, formatId: metadata.formats[0].id, collectionId: 'field-notes', tags: 'original, installed', notes: 'Find installed reflections.' };
    const callbacks = { progress() {}, async duplicate() { return 'existing'; } };
    const saved = await service.save(draft, metadata, AbortSignal.timeout(30000), callbacks);
    assert.equal(await local.status(saved.item), 'present');
    assert.equal(searchCatalogue((await local.read()).items, 'installed reflections').length, 1);
    await service.save(draft, metadata, AbortSignal.timeout(30000), callbacks); assert.equal((await local.read()).items.length, 1);
    const dashMetadata = await service.inspect(url.replace('original.mp4', 'manifest.mpd'), AbortSignal.timeout(30000));
    const mergedFormat = dashMetadata.formats.find(format => format.id.includes('+')); assert.ok(mergedFormat);
    const merged = await service.save({ ...draft, sourceUrl: dashMetadata.sourceUrl, formatId: mergedFormat.id }, dashMetadata, AbortSignal.timeout(30000), callbacks);
    assert.equal(await local.status(merged.item), 'present');
    const probe = JSON.parse((await run(path.join(tools, 'ffprobe.exe'), ['-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'json', await local.guard(merged.item.relativePath)], { windowsHide: true })).stdout);
    assert.deepEqual(probe.streams.map(stream => stream.codec_type).sort(), ['audio', 'video']);
    const exported = path.join(work, 'installed-export.json'); await local.exportTo(exported);
    assert.equal(JSON.parse(await fs.readFile(exported, 'utf8')).items[0].hash, saved.item.hash);
    return { result: 'pass', source: 'original generated media over loopback', savedHash: saved.item.hash, bytes: saved.item.bytes, duplicateCount: 1, noteSearch: 'pass', metadataExport: 'pass', separateAudioVideoMerge: 'pass' };
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
