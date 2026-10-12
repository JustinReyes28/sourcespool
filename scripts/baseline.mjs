import { spawnSync } from 'node:child_process';
import { readdir, stat, writeFile } from 'node:fs/promises';
import { cpus, platform, release, totalmem } from 'node:os';
import { performance } from 'node:perf_hooks';
import { searchItems } from '../dist/application/design-simulator.js';
import { fixtureItems } from '../dist/adapters/fixtures.js';

async function footprint(path) {
  let bytes = 0, files = 0;
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const full = `${path}/${entry.name}`;
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) { const sub = await footprint(full); bytes += sub.bytes; files += sub.files; }
    else { bytes += (await stat(full)).size; files++; }
  }
  return { bytes, files };
}

const startup = [];
for (let i = 0; i < 7; i++) {
  const start = performance.now();
  const result = spawnSync(process.execPath, ['dist/cli.js', '--snapshot', 'home'], { encoding: 'utf8', timeout: 10000 });
  if (result.status !== 0 || !result.stdout.includes('Your references')) throw new Error(result.stderr || 'Snapshot failed');
  startup.push(performance.now() - start);
}
const items = Array.from({ length: 1000 }, (_, index) => ({ ...fixtureItems[index % 2], id: `bench-${index}` }));
const search = [];
for (let i = 0; i < 100; i++) { const start = performance.now(); searchItems(items, 'rain reflections'); search.push(performance.now() - start); }
const percentile = (values, p) => Number([...values].sort((a,b)=>a-b)[Math.ceil(values.length * p) - 1].toFixed(3));
const result = {
  measuredAt: new Date().toISOString(),
  hostLabel: 'SourceSpool development host (Windows x64; no hostname or user paths exported)',
  environment: { platform: platform(), osRelease: release(), arch: process.arch, node: process.version, cpu: cpus()[0]?.model, memoryGiB: Number((totalmem() / 1024 ** 3).toFixed(1)) },
  startup: { metric: 'new process to fixture home snapshot, not interactive first paint', samples: 7, medianMs: percentile(startup, 0.5), maxMs: percentile(startup, 1), rawMs: startup.map(value => Number(value.toFixed(3))) },
  search: { metric: 'in-memory metadata query on 1000 synthetic records, no disk or render', samples: 100, medianMs: percentile(search, 0.5), p95Ms: percentile(search, 0.95) },
  footprint: { dependencies: await footprint('node_modules'), build: await footprint('dist'), excludes: ['Node runtime', 'npm cache', 'yt-dlp', 'ffmpeg', 'media files'] },
  provisionalTargets: { startupMedianMs: 1500, searchP95Ms: 50, installedScaffoldMiB: 100, productionValidation: 'Re-measure with real JSON catalogue, interactive TTY, pinned external tools and file I/O in phase 3.' }
};
await writeFile('docs/baseline.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
