import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { installTools, readManagedTools } from '../src/adapters/tool-setup.js';
import { temporaryLibrary } from './helpers.js';

const cache = path.resolve(process.env.SOURCESPOOL_TOOL_CACHE ?? '.tmp/tools');
test('verified cached setup is offline, idempotent and preserves the active installation on failures', { timeout: 120000 }, async () => {
  const temp = await temporaryLibrary(); const root = path.join(temp.directory, 'tools 雨'); const bad = path.join(temp.directory, 'bad artifacts');
  const oldFetch = globalThis.fetch; let requests = 0; globalThis.fetch = async () => { requests++; throw Error('Unexpected network'); };
  try {
    const first = await installTools({ root, sourceDirectory: cache }); assert.deepEqual(await readManagedTools(root), first);
    const second = await installTools({ root }); assert.deepEqual(second, first); assert.equal(requests, 0);
    await fs.mkdir(bad); await fs.writeFile(path.join(bad, 'yt-dlp.exe'), 'invalid');
    await assert.rejects(installTools({ root, sourceDirectory: bad, repair: true }), /Checksum mismatch/);
    assert.deepEqual(await readManagedTools(root), first); assert.equal(requests, 0);
    await fs.writeFile(path.join(root, 'setup.lock'), JSON.stringify({ pid: process.pid }));
    await assert.rejects(installTools({ root, sourceDirectory: cache }), /Another tool setup/); await fs.unlink(path.join(root, 'setup.lock'));
    const abort = new AbortController();
    await assert.rejects(installTools({ root, sourceDirectory: cache, repair: true, signal: abort.signal, progress(message) { if (message.includes('ffmpeg.zip')) abort.abort(); } }), { name: 'AbortError' });
    assert.deepEqual(await readManagedTools(root), first); assert.equal(requests, 0);
    assert.deepEqual((await fs.readdir(root)).filter(p => p.startsWith('.staging-') || p.endsWith('.tmp') || p === 'setup.lock'), []);
    const dead = spawn(process.execPath, ['-e', ''], { windowsHide: true }); await once(dead, 'close'); assert.ok(dead.pid);
    const orphan = 'release-' + randomUUID(); await fs.mkdir(path.join(root, orphan)); await fs.writeFile(path.join(root, orphan, 'partial'), 'owned incomplete bytes');
    await fs.writeFile(path.join(root, 'setup.lock'), JSON.stringify({ pid: dead.pid, release: orphan }));
    assert.deepEqual(await installTools({ root }), first); await assert.rejects(fs.access(path.join(root, orphan)));
    const activeRelease = JSON.parse(await fs.readFile(path.join(root, 'current.json'), 'utf8')).release;
    await fs.writeFile(path.join(root, 'setup.lock'), JSON.stringify({ pid: dead.pid, release: activeRelease }));
    assert.deepEqual(await installTools({ root }), first); await fs.access(first.ytDlp);
    const repaired = await installTools({ root, sourceDirectory: cache, repair: true }); assert.notEqual(repaired.ytDlp, first.ytDlp);
    await fs.access(first.ytDlp); assert.deepEqual(await readManagedTools(root), repaired);
    await fs.appendFile(repaired.ytDlp, 'changed'); await assert.rejects(readManagedTools(root), /incomplete or changed/);
  } finally { globalThis.fetch = oldFetch; await temp.cleanup(); }
});
test('setup requires an explicit artifact source or download action and cancellation leaves no installation', async () => {
  const temp = await temporaryLibrary();
  try {
    const root = path.join(temp.directory, 'empty tools'); await assert.rejects(installTools({ root }), /No download was started/); assert.equal(await readManagedTools(root), null);
    const abort = new AbortController(); abort.abort(); const untouched = path.join(temp.directory, 'untouched');
    await assert.rejects(installTools({ root: untouched, sourceDirectory: cache, signal: abort.signal }), { name: 'AbortError' });
    await assert.rejects(fs.access(untouched));
  } finally { await temp.cleanup(); }
});
