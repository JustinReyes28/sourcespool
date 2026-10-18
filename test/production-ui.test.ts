import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough, Writable } from 'node:stream';
import { setTimeout as delay } from 'node:timers/promises';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { createElement, act } from 'react';
import { render } from 'ink';
import { ProductionApp } from '../src/ui/production-app.js';
import { ApplicationController } from '../src/application/controller.js';
import { LibraryService } from '../src/application/library-service.js';
import { temporaryLibrary, FileDownloader, metadata } from './helpers.js';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
async function harness(controller: ApplicationController) {
  const chunks: string[] = [];
  // Export and details actions return promises without using the background-task tracker.
  const originalContinue = controller.continue;
  let continuation = Promise.resolve();
  controller.continue = () => { continuation = originalContinue.call(controller); return continuation; };
  const stdin = Object.assign(new PassThrough(), { isTTY: true, isRaw: false, setRawMode(raw: boolean) { this.isRaw = raw; return this; } });
  const stdout = Object.assign(new Writable({ write(chunk, _encoding, callback) { chunks.push(String(chunk)); callback(); } }), { isTTY: true, columns: 80, rows: 30 });
  let instance!: ReturnType<typeof render>;
  await act(async () => { instance = render(createElement(ProductionApp, { controller }), { stdin, stdout, stderr: stdout, debug: true, patchConsole: false, exitOnCtrlC: false, interactive: true }); });
  await instance.waitUntilRenderFlush();
  return {
    initial: chunks.join(''), stdin,
    async key(value: string) {
      const mark = chunks.length;
      await act(async () => { stdin.write(value); if (value === '\u001b') await delay(60); await delay(5); await continuation; if (controller.state.busy && controller.state.page !== 'duplicate') await Promise.race([controller.waitForIdle(), delay(50)]); });
      await instance.waitUntilRenderFlush(); return chunks.slice(mark).join('');
    },
    async resize(columns: number, rows: number) { const mark = chunks.length; await act(async () => { stdout.columns = columns; stdout.rows = rows; stdout.emit('resize'); }); await instance.waitUntilRenderFlush(); return chunks.slice(mark).join(''); },
    async close() { await act(async () => { controller.cancel(); await continuation; await controller.waitForIdle(); instance.unmount(); }); controller.continue = originalContinue; stdin.destroy(); stdout.destroy(); }
  };
}

test('production keyboard journey writes a real catalogue, searches notes and exports metadata', async () => {
  const temp = await temporaryLibrary(); const controller = new ApplicationController(new LibraryService(temp.library, new FileDownloader())); await controller.initialize();
  const app = await harness(controller);
  try {
    assert.match(app.initial, /0 saved/); await app.key('a'); await app.key('file:///no');
    assert.match(await app.key('\r'), /Error:/); assert.equal(controller.state.page, 'url');
    await app.key('\u0015'); await app.key(metadata().sourceUrl); assert.match(await app.key('\r'), /Format/);
    await app.key('\r'); await app.key('rain'); await app.key('\t'); await app.key('Remember the prism.'); await app.key('\u000b');
    assert.equal(controller.state.draft.collectionId, 'studio');
    await app.key('\r'); assert.match(await app.key('\u001b'), /Remember the prism/);
    await app.key('\r'); await app.key('\r');
    await act(async () => { await controller.waitForIdle(); }); assert.equal(controller.state.page, 'completed');
    assert.equal((await temp.library.read()).items.length, 1);
    await app.key('\r'); assert.match(await app.key('prism'), /Rain reflections/); assert.match(await app.key('\r'), /Reference details/);
    await app.key('\u001b'); await app.key('\u001b'); await app.key('e');
    const exported = path.join(temp.directory, 'keyboard-export.json'); await app.key(exported); await app.key('\r');
    assert.equal(JSON.parse(await fs.readFile(exported, 'utf8')).items[0].notes, 'Remember the prism.');
  } finally { await app.close(); await temp.cleanup(); }
});

test('production help, compact view, short-terminal guard and raw input cleanup work', async () => {
  const temp = await temporaryLibrary(); const controller = new ApplicationController(new LibraryService(temp.library, new FileDownloader())); await controller.initialize();
  const app = await harness(controller);
  try {
    assert.match(await app.key('\u0007'), /Keyboard help/); await app.key('\u001b');
    assert.match(await app.resize(40, 30), /Compact view/); assert.match(await app.resize(40, 10), /Resize to at least/);
    await app.key('a'); assert.equal(controller.state.page, 'home'); await app.resize(80, 30);
    await app.key('\u0003'); assert.equal(app.stdin.isRaw, false); assert.equal(controller.state.canExit, true);
  } finally { await app.close(); await temp.cleanup(); }
});

test('duplicate choices are keyboard accessible while the production save is pending', async () => {
  const temp = await temporaryLibrary(); const controller = new ApplicationController(new LibraryService(temp.library, new FileDownloader())); await controller.initialize();
  const app = await harness(controller);
  try {
    await app.key('a'); await app.key(metadata().sourceUrl); await app.key('\r'); await app.key('\r'); await app.key('\r'); await app.key('\r');
    await act(async () => { await controller.waitForIdle(); });
    await app.key('\u001b'); await app.key('a'); await app.key('\r'); await app.key('\r'); await app.key('\r');
    assert.match(await app.key('\r'), /already saved/); assert.equal(controller.state.page, 'duplicate');
    await app.key('k'); await act(async () => { await controller.waitForIdle(); });
    assert.equal(controller.state.page, 'completed'); assert.equal(controller.state.catalogue.items.length, 1);
  } finally { await app.close(); await temp.cleanup(); }
});

test('long notes keep the editing cursor visible and long help/details can be paged in a small terminal', async () => {
  const temp = await temporaryLibrary(); const controller = new ApplicationController(new LibraryService(temp.library, new FileDownloader())); await controller.initialize();
  const app = await harness(controller);
  try {
    await app.resize(40, 18); await app.key('a'); await app.key(metadata().sourceUrl); await app.key('\r'); await app.key('\r'); await app.key('\t');
    const notes = 'START ' + 'rain '.repeat(150) + 'END';
    assert.match(await app.key(notes), /END▏/); assert.equal(controller.state.draft.notes, notes);
    assert.match(await app.key('\u001b[H'), /▏START/);
    await app.key('\u0007'); const paged = await app.key('\u001b[6~'); assert.match(paged, /lines [2-9][0-9]*–/);
    await app.key('\u001b'); await app.key('\r'); await app.key('\r'); await act(async () => { await controller.waitForIdle(); });
    await app.key('\r'); await app.key('\r'); assert.equal(controller.state.page, 'details');
    assert.match(await app.key('\u001b[6~'), /PgUp\/PgDn scroll/);
  } finally { await app.close(); await temp.cleanup(); }
});
