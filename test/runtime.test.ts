import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runProduction } from '../src/production-cli.js';

test('production startup accepts Node 22 and newer and rejects older runtimes', async t => {
  const original = Object.getOwnPropertyDescriptor(process.versions, 'node')!;
  try {
    for (const version of ['22.0.0', '22.21.1', '24.0.0', '24.19.0', '25.2.1', '26.0.0', '27.0.0']) {
      await t.test(`Node ${version} reaches production option validation`, async () => {
        Object.defineProperty(process.versions, 'node', { ...original, value: version });
        await assert.rejects(runProduction(['--setup', '--check-tools', '--library', 'unused']), /Choose --setup or --check-tools/);
      });
    }
    for (const version of ['18.20.0', '20.19.0', '21.7.3']) {
      await t.test(`Node ${version} receives an upgrade instruction`, async () => {
        Object.defineProperty(process.versions, 'node', { ...original, value: version });
        await assert.rejects(runProduction([]), { message: `SourceSpool requires Node 22 or newer; found Node ${version}. Install Node 24 LTS or a newer supported release.` });
      });
    }
  } finally {
    Object.defineProperty(process.versions, 'node', original);
  }
});
