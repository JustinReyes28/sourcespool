import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { namingPath, parseCatalogue, relativePath, sourceUrl, validateCatalogue, validateTemplate, searchCatalogue } from '../src/domain/catalogue.js';
import { LocalLibrary } from '../src/adapters/local-library.js';
import { LibraryService } from '../src/application/library-service.js';
import { ApplicationController } from '../src/application/controller.js';
import { temporaryLibrary, stagedItem, FileDownloader, metadata, draft, DEFAULT_TEMPLATE } from './helpers.js';
import type { DuplicateChoice } from '../src/application/library-service.js';
import { openItem } from '../src/adapters/opener.js';
import { readSettings, writeSettings } from '../src/adapters/settings.js';

test('URL, template and import validation reject unsafe or corrupt input', async () => {
  for (const value of ['file:///C:/secret', 'https://name:pass@example.org/a', 'https://example.org/\nhi', 'javascript:alert(1)', 'https://example.org/a b']) assert.throws(() => sourceUrl(value));
  assert.equal(sourceUrl('https://example.org/a?key=abc'), 'https://example.org/a?key=abc');
  for (const value of ['../{title}.{ext}', 'C:/{title}.{ext}', '{unknown}.{ext}', '{title}', 'CON/{title}.{ext}', '{title}\\{ext}', '{title}/../{id}.{ext}', '{title}.{ext}:stream']) assert.throws(() => validateTemplate(value));
  for (const value of ['../outside.mp4', '/absolute.mp4', 'folder/NUL.mp4', 'folder/a.mp4:ads', 'folder\\a.mp4', 'folder/a.']) assert.throws(() => relativePath(value));
  const filename = namingPath({ id: 'field-notes', name: 'Field notes', namingTemplate: DEFAULT_TEMPLATE }, 'CON', 'safe', 'mp4', '2026-10-18T00:00:00.000Z');
  assert.equal(filename, 'field-notes/2026-10-18-_CON-safe.mp4');
  assert.throws(() => parseCatalogue('{bad'));
  assert.throws(() => validateCatalogue({ schemaVersion: 99 }));
});

test('real save persists context, survives reload and is found by notes and combined terms', async () => {
  const temp = await temporaryLibrary();
  try {
    const service = new LibraryService(temp.library, new FileDownloader());
    const identity = { id: randomUUID(), createdAt: '2026-10-18T00:00:00.000Z' };
    const result = await service.save(draft(), metadata(), new AbortController().signal, { progress() {}, async duplicate() { return 'another'; } }, identity);
    const reopened = new LocalLibrary(temp.directory); await reopened.initialize(); const saved = await reopened.read();
    assert.equal(saved.items.length, 1); assert.equal(saved.items[0]!.id, identity.id);
    assert.equal(await reopened.status(result.item), 'present'); assert.equal(result.item.hash.length, 64);
    assert.deepEqual(searchCatalogue(saved.items, 'reflections rain'), saved.items); assert.equal(searchCatalogue(saved.items, 'reflections missing').length, 0);
    assert.equal(result.item.relativePath, namingPath(saved.collections[0]!, metadata().title, identity.id, 'mp4', identity.createdAt));
    assert.equal((await fs.readdir(path.join(temp.directory, '.staging'))).length, 0);
    assert.equal((await fs.readdir(path.join(temp.directory, '.transactions'))).length, 0);
  } finally { await temp.cleanup(); }
});

test('source and hash duplicates require choices; keeping changes no counts and another never overwrites', async () => {
  const temp = await temporaryLibrary();
  try {
    const downloader = new FileDownloader(); const service = new LibraryService(temp.library, downloader); const signal = new AbortController().signal;
    const callbacks = { progress() {}, async duplicate(): Promise<DuplicateChoice> { return 'another'; } };
    const first = await service.save(draft(), metadata(), signal, callbacks); const bytes = await fs.readFile(await temp.library.guard(first.item.relativePath));
    const reasons: string[] = [];
    const kept = await service.save(draft(), metadata(), signal, { progress() {}, async duplicate(_item, reason) { reasons.push(reason); return 'existing'; } });
    assert.equal(kept.item.id, first.item.id); assert.equal(downloader.calls, 1); assert.deepEqual(reasons, ['source']);
    const otherUrl = 'https://example.org/different.mp4';
    await service.save(draft(otherUrl), metadata(otherUrl), signal, { progress() {}, async duplicate(_item, reason) { reasons.push(reason); return 'existing'; } });
    assert.deepEqual(reasons, ['source', 'hash']); assert.equal((await temp.library.read()).items.length, 1);
    const another = await service.save(draft(), metadata(), signal, callbacks);
    assert.notEqual(another.item.relativePath, first.item.relativePath); assert.deepEqual(await fs.readFile(await temp.library.guard(first.item.relativePath)), bytes);
    assert.equal((await temp.library.read()).items.length, 2);
  } finally { await temp.cleanup(); }
});

test('existing filenames are atomically allocated with a suffix and preserved byte-for-byte', async () => {
  const temp = await temporaryLibrary();
  try {
    await fs.mkdir(path.join(temp.directory, 'field-notes')); await fs.writeFile(path.join(temp.directory, 'field-notes/reference.mp4'), 'pre-existing');
    const stage = await stagedItem(temp.library);
    const result = await temp.library.commitFile(stage.item, stage.absolute, stage.job, false, new AbortController().signal, () => {});
    assert.equal(result.item.relativePath, 'field-notes/reference-2.mp4');
    assert.equal(await fs.readFile(path.join(temp.directory, 'field-notes/reference.mp4'), 'utf8'), 'pre-existing');
  } finally { await temp.cleanup(); }
});

test('catalogue replacement failure preserves the old valid index and its backup', async () => {
  const temp = await temporaryLibrary();
  try {
    const before = await fs.readFile(path.join(temp.directory, 'catalogue.json'), 'utf8');
    const failing = new LocalLibrary(temp.directory, { async beforeReplace() { throw new Error('simulated disk replacement failure'); } });
    await assert.rejects(failing.update(current => ({ ...current, collections: [...current.collections, { id: 'new', name: 'New', namingTemplate: DEFAULT_TEMPLATE }] })));
    assert.equal(await fs.readFile(path.join(temp.directory, 'catalogue.json'), 'utf8'), before);
    assert.equal(await fs.readFile(path.join(temp.directory, 'catalogue.json.bak'), 'utf8'), before);
    assert.equal((await temp.library.read()).revision, 0);
  } finally { await temp.cleanup(); }
});

test('writer exclusion and expected revisions prevent concurrent lost updates', async () => {
  const temp = await temporaryLibrary();
  try {
    let release!: () => void; let entered!: () => void; const started = new Promise<void>(r => { entered = r; });
    const first = temp.library.update(async current => { entered(); await new Promise<void>(r => { release = r; }); current.collections[0]!.name = 'Updated'; return current; });
    await started;
    await assert.rejects(new LocalLibrary(temp.directory).update(c => c), /locked/);
    release(); await first;
    await assert.rejects(temp.library.save(await temp.library.read(), 0), /changed/);
    assert.equal((await temp.library.read()).collections[0]!.name, 'Updated');
  } finally { await temp.cleanup(); }
});

test('crash after promotion leaves a journal; recovery verifies and commits exactly once', async () => {
  const temp = await temporaryLibrary();
  try {
    const stage = await stagedItem(temp.library);
    const failing = new LocalLibrary(temp.directory, { async afterPromotion() { throw new Error('simulated crash'); } });
    await assert.rejects(failing.commitFile(stage.item, stage.absolute, stage.job, false, new AbortController().signal, () => {}));
    assert.equal((await temp.library.read()).items.length, 0);
    const pending = await temp.library.recovery(); assert.equal(pending.length, 1); assert.equal(pending[0]!.state, 'ready');
    await temp.library.recover(stage.job, 'recover'); assert.equal((await temp.library.read()).items.length, 1);
    assert.deepEqual(await temp.library.recovery(), []);
    await assert.rejects(temp.library.recover(stage.job, 'recover'), /no longer/);
  } finally { await temp.cleanup(); }
});

test('changed recovery files cannot be committed; unlisted choice preserves the media', async () => {
  const temp = await temporaryLibrary();
  try {
    const stage = await stagedItem(temp.library);
    const failing = new LocalLibrary(temp.directory, { async afterPromotion() { throw new Error('crash'); } });
    await assert.rejects(failing.commitFile(stage.item, stage.absolute, stage.job, false, new AbortController().signal, () => {}));
    await fs.writeFile(await temp.library.guard(stage.item.relativePath), 'tampered');
    assert.equal((await temp.library.recovery())[0]!.state, 'invalid');
    await assert.rejects(temp.library.recover(stage.job, 'recover'), /missing or changed/);
    await temp.library.recover(stage.job, 'unlisted');
    assert.equal(await fs.readFile(await temp.library.guard(stage.item.relativePath), 'utf8'), 'tampered');
    assert.equal((await temp.library.read()).items.length, 0);
  } finally { await temp.cleanup(); }
});

test('metadata export/import round-trips context and marks missing media without deleting history', async () => {
  const temp = await temporaryLibrary(); const fresh = await temporaryLibrary();
  try {
    const service = new LibraryService(temp.library, new FileDownloader());
    await service.save(draft(), metadata(), new AbortController().signal, { progress() {}, async duplicate() { return 'another'; } });
    const exported = path.join(temp.directory, 'export.json'); await temp.library.exportTo(exported);
    const preview = await fresh.library.importPreview(exported); assert.equal(preview.added, 1); assert.equal(preview.missing, 1);
    await fresh.library.importCatalogue(preview.incoming, 'keep');
    const original = (await temp.library.read()).items[0]!; const imported = (await fresh.library.read()).items[0]!;
    assert.deepEqual(imported, original); assert.equal(await fresh.library.status(imported), 'missing');
    await assert.rejects(temp.library.exportTo(exported), { code: 'EEXIST' });
    const bad = path.join(temp.directory, 'bad.json'); await fs.writeFile(bad, JSON.stringify({ ...preview.incoming, items: [{ ...original, relativePath: '../outside.mp4' }] }));
    const before = await fresh.library.read(); await assert.rejects(fresh.library.importPreview(bad)); assert.deepEqual(await fresh.library.read(), before);
    const incoming = structuredClone(preview.incoming); incoming.items[0]!.notes = 'Imported note';
    await fs.writeFile(exported, JSON.stringify(incoming)); assert.equal((await fresh.library.importPreview(exported)).conflicts, 1);
    await fresh.library.importCatalogue(incoming, 'keep'); assert.equal((await fresh.library.read()).items[0]!.notes, original.notes);
    await fresh.library.importCatalogue(incoming, 'incoming'); assert.equal((await fresh.library.read()).items[0]!.notes, 'Imported note');
  } finally { await temp.cleanup(); await fresh.cleanup(); }
});

test('junction paths, unsafe imports, empty files and corrupt catalogues fail closed', async () => {
  const temp = await temporaryLibrary(); const outside = await temporaryLibrary();
  try {
    const link = path.join(temp.directory, 'linked'); await fs.symlink(outside.directory, link, process.platform === 'win32' ? 'junction' : 'dir');
    try { await assert.rejects(temp.library.guard('linked/escape.mp4'), /links|junctions/); } finally { await fs.unlink(link); }
    const stage = await temp.library.createStaging(); const file = path.join(stage.directory, 'empty.mp4'); await fs.writeFile(file, '');
    await assert.rejects(temp.library.verify(file), /empty/); await temp.library.discardJob(stage.job);
    await fs.writeFile(path.join(temp.directory, 'catalogue.json'), '{broken');
    await assert.rejects(temp.library.initialize(), /valid JSON/);
    assert.equal(await fs.readFile(path.join(temp.directory, 'catalogue.json'), 'utf8'), '{broken');
  } finally { await temp.cleanup(); await outside.cleanup(); }
});

test('cancellation before commit discards partial files, adds no record and retains controller draft', async () => {
  const temp = await temporaryLibrary();
  try {
    const controller = new ApplicationController(new LibraryService(temp.library, new FileDownloader('partial file', true)));
    await controller.initialize(); controller.navigate('url'); controller.edit(metadata().sourceUrl); await controller.continue(); await controller.waitForIdle();
    await controller.continue(); controller.edit('rain'); controller.patch({ field: 1 }); controller.edit('remember this draft'); await controller.continue(); await controller.continue();
    await new Promise<void>(r => setTimeout(r, 30)); controller.cancel(); await controller.waitForIdle();
    assert.equal(controller.state.page, 'cancelled'); assert.equal(controller.state.draft.notes, 'remember this draft');
    assert.equal((await temp.library.read()).items.length, 0); assert.deepEqual(await fs.readdir(path.join(temp.directory, '.staging')), []);
  } finally { await temp.cleanup(); }
});

test('exit during commit waits and reports the committed save instead of cancellation', async () => {
  let promoted!: () => void; let release!: () => void; const reached = new Promise<void>(r => { promoted = r; });
  const temp = await temporaryLibrary({ async afterPromotion() { promoted(); await new Promise<void>(r => { release = r; }); } });
  try {
    const controller = new ApplicationController(new LibraryService(temp.library, new FileDownloader())); await controller.initialize();
    controller.navigate('url'); controller.edit(metadata().sourceUrl); await controller.continue(); await controller.waitForIdle();
    await controller.continue(); await controller.continue(); await controller.continue(); await reached;
    controller.cancel(true); assert.equal(controller.state.canExit, false); assert.equal(controller.state.work, 'committing');
    release(); await controller.waitForIdle(); assert.equal(controller.state.page, 'completed'); assert.equal(controller.state.canExit, true);
    assert.equal((await temp.library.read()).items.length, 1); assert.match(controller.state.notice, /Saved and verified/);
  } finally { await temp.cleanup(); }
});

test('collection templates persist and an invalid template never replaces saved settings', async () => {
  const temp = await temporaryLibrary();
  try {
    const controller = new ApplicationController(new LibraryService(temp.library, new FileDownloader())); await controller.initialize();
    controller.navigate('collection'); controller.edit('Research 雨'); await controller.continue(); assert.equal(controller.state.catalogue.collections.length, 3);
    controller.navigate('settings'); controller.edit('', true); controller.edit('{collection}/{title}.{ext}'); await controller.continue();
    assert.match(controller.state.notice, /saved/); const selected = controller.state.draft.collectionId;
    controller.edit('', true); controller.edit('../{title}.{ext}'); await controller.continue(); assert.ok(controller.state.error);
    assert.equal((await temp.library.read()).collections.find(c => c.id === selected)!.namingTemplate, '{collection}/{title}.{ext}');
  } finally { await temp.cleanup(); }
});

test('field cursor editing inserts, deletes and moves through Unicode without losing drafts', async () => {
  const temp = await temporaryLibrary();
  try {
    const controller = new ApplicationController(new LibraryService(temp.library, new FileDownloader())); await controller.initialize();
    controller.navigate('collection'); controller.edit('Rain 雨'); controller.moveCursor(-1); controller.edit('warm ');
    assert.equal(controller.state.input, 'Rain warm 雨'); controller.edit('', false, false, true); assert.equal(controller.state.input, 'Rain warm ');
    controller.moveCursor('home'); controller.edit('A '); controller.moveCursor('end'); controller.edit('', false, true); assert.equal(controller.state.input, 'A Rain warm');
    controller.edit('', true); assert.equal(controller.state.cursor, 0); assert.equal(controller.state.input, '');
  } finally { await temp.cleanup(); }
});

test('missing/changed files and executable imports fail opening while details remain usable', async () => {
  const temp = await temporaryLibrary();
  try {
    const stage = await stagedItem(temp.library);
    await temp.library.commitFile(stage.item, stage.absolute, stage.job, false, new AbortController().signal, () => {});
    const controller = new ApplicationController(new LibraryService(temp.library, new FileDownloader())); await controller.initialize();
    controller.navigate('library'); await controller.continue(); const selected = controller.state.catalogue.items[0]!;
    await fs.unlink(await temp.library.guard(selected.relativePath)); await controller.open('file');
    assert.equal(controller.state.page, 'details'); assert.match(controller.state.error, /missing|changed/); assert.equal(controller.state.catalogue.items[0]!.sourceUrl, selected.sourceUrl);
    await assert.rejects(openItem(temp.library, { ...selected, relativePath: 'studio/unsafe.exe' }, 'file'), /Only supported/);
    await assert.rejects(openItem(temp.library, { ...selected, sourceUrl: 'javascript:alert(1)' }, 'source'), /http/);
  } finally { await temp.cleanup(); }
});

test('already committed journals are dismissed without duplicating the item', async () => {
  const temp = await temporaryLibrary();
  try {
    const stage = await stagedItem(temp.library); await temp.library.commitFile(stage.item, stage.absolute, stage.job, false, new AbortController().signal, () => {});
    await fs.writeFile(path.join(temp.directory, '.transactions', stage.job + '.json'), JSON.stringify({ version: 1, job: stage.job, item: stage.item, staged: `.staging/${stage.job}/media.mp4` }));
    assert.equal((await temp.library.recovery())[0]!.state, 'committed'); await temp.library.recover(stage.job, 'recover'); assert.equal((await temp.library.read()).items.length, 1);
  } finally { await temp.cleanup(); }
});

test('settings persist atomically and malformed settings are rejected', async () => {
  const temp = await temporaryLibrary();
  try {
    const file = path.join(temp.directory, 'settings.json');
    const settings = { schemaVersion: 1 as const, libraryRoot: temp.directory, ytDlp: 'C:/Tools/yt-dlp.exe', ffmpeg: 'C:/Tools/ffmpeg.exe' };
    await writeSettings(settings, file); assert.deepEqual(await readSettings(file), settings);
    await writeSettings({ ...settings, ytDlp: 'C:/Other tools/yt-dlp.exe' }, file); assert.equal((await readSettings(file))!.ytDlp, 'C:/Other tools/yt-dlp.exe');
    await fs.writeFile(file, '{broken'); await assert.rejects(readSettings(file), /Settings|settings/);
    assert.equal(await readSettings(path.join(temp.directory, 'absent.json')), null);
  } finally { await temp.cleanup(); }
});
