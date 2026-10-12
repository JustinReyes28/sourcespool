import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough, Writable } from 'node:stream';
import { setTimeout as delay } from 'node:timers/promises';
import { createElement, act } from 'react';
import { render } from 'ink';
import { App } from '../src/ui/app.js';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

async function harness(empty = false) {
  const chunks: string[] = [];
  const stdin = Object.assign(new PassThrough(), { isTTY: true, isRaw: false,
    setRawMode(raw: boolean) { this.isRaw = raw; return this; } });
  const stdout = Object.assign(new Writable({ write(chunk, _encoding, callback) { chunks.push(String(chunk)); callback(); } }),
    { isTTY: true, columns: 80, rows: 30 });
  let instance!: ReturnType<typeof render>;
  await act(async () => { instance = render(createElement(App, { empty }), { stdin, stdout, stderr: stdout,
    debug: true, patchConsole: false, exitOnCtrlC: false, interactive: true }); });
  await instance.waitUntilRenderFlush();
  return {
    initial: chunks.join(''), stdin, stdout,
    async key(value: string) {
      const mark = chunks.length;
      await act(async () => {
        stdin.write(value);
        // Ink waits briefly to distinguish a lone Esc from a longer escape sequence.
        if (value === '\u001b') await delay(60);
      });
      await instance.waitUntilRenderFlush();
      return chunks.slice(mark).join('');
    },
    async resize(columns: number) {
      const mark = chunks.length;
      await act(async () => { stdout.columns = columns; stdout.emit('resize'); });
      await instance.waitUntilRenderFlush();
      return chunks.slice(mark).join('');
    },
    async close() { await act(async () => { instance.unmount(); }); stdin.destroy(); stdout.destroy(); },
    async exit() { await act(async () => { stdin.write('\u0003'); }); await instance.waitUntilExit(); return stdin.isRaw; }
  };
}

test('keyboard walkthrough saves a fixture and finds it through the library', async () => {
  const app = await harness(true);
  try {
    assert.match(app.initial, /Start a collection/);
    assert.match(await app.key('a'), /Add a reference · Source/);
    for (const title of ['Reading source', 'Add a reference · Format', 'Add a reference · Organize', 'Ready to save', 'Saving reference', 'Reference saved']) {
      assert.match(await app.key('\r'), new RegExp(title));
    }
    assert.match(await app.key('\r'), /Search library/);
    assert.match(await app.key('reflections'), /Rain on the studio window/);
    assert.match(await app.key('\r'), /Reference details/);
  } finally { await app.close(); }
});

test('help does not consume draft text and collection shortcut works without exiting', async () => {
  const app = await harness();
  try {
    await app.key('a');
    assert.match(await app.key('\u0007'), /Help/);
    await app.key('\u001b');
    for (let i = 0; i < 3; i++) await app.key('\r');
    assert.match(await app.key('\u000b'), /Studio references/);
    await app.key('\t');
    await app.key('\u0015');
    assert.match(await app.key('Remember the prism.'), /Remember the prism/);
    await app.key('\r');
    assert.match(await app.key('\u001b'), /Remember the prism/);
  } finally { await app.close(); }
});

test('cancelled work retains its draft and resizing uses the compact layout', async () => {
  const app = await harness();
  try {
    await app.key('a');
    await app.key('\r');
    assert.match(await app.key('x'), /Save cancelled/);
    assert.match(await app.key('r'), /example.com/);
    assert.match(await app.resize(40), /Compact view/);
    const raw = await app.exit();
    assert.equal(raw, false, 'Ink must release raw input on exit in the controlled stream');
  } finally { await app.close(); }
});
