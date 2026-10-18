import * as fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import os from 'node:os';
const { fileURLToPath } = await import('node:url'); const project = fileURLToPath(new URL('../', import.meta.url));
const destination = path.join(project, '.tmp', 'production-measurements'); await fs.mkdir(destination, { recursive: true });
if (process.argv.includes('--trial')) {
  const start = performance.now();
  const { runProduction } = await import('../dist/production-cli.js');
  let elapsed, ready;
  await runProduction(['--library', path.join(destination, 'startup-library'), '--yt-dlp', process.env.SOURCESPOOL_YTDLP, '--ffmpeg', process.env.SOURCESPOOL_FFMPEG], { onFirstPaint() { elapsed = performance.now() - start; }, onReady(controller) { ready = performance.now() - start; controller.cancel(true); } });
  await fs.writeFile(path.join(destination, 'trial.json'), JSON.stringify({ ms: elapsed, readyMs: ready }));
} else {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw Error('Run this benchmark in a real Windows terminal/PTY.');
  const startup = [], ready = [];
  for (let i = 0; i < 7; i++) {
    await new Promise((resolve, reject) => { const child = spawn(process.execPath, [fileURLToPath(import.meta.url), '--trial'], { cwd: project, stdio: 'inherit', windowsHide: true }); child.on('error', reject); child.on('close', code => code === 0 ? resolve() : reject(Error('Startup trial failed'))); });
    const trial = JSON.parse(await fs.readFile(path.join(destination, 'trial.json'), 'utf8')); startup.push(trial.ms); ready.push(trial.readyMs);
  }
  const { LocalLibrary } = await import('../dist/adapters/local-library.js');
  const { searchCatalogue, DEFAULT_TEMPLATE } = await import('../dist/domain/catalogue.js');
  const library = new LocalLibrary(path.join(destination, 'bench-library')); await library.initialize();
  const items = Array.from({ length: 1000 }, (_, i) => ({ id: `bench-${i}`, sourceUrl: `https://example.org/original-${i}.mp4`, title: `Original ${i}`, sourceIdentity: { extractor: 'measurement', sourceId: String(i), formatId: 'mp4' }, createdAt: '2026-10-18T00:00:00.000Z', relativePath: `field-notes/reference-${i}.mp4`, bytes: 1000, hash: i.toString(16).padStart(64, '0'), tags: ['rain', i % 2 ? 'warm' : 'cold'], notes: `Reflections in original study ${i}`, collectionId: 'field-notes' }));
  await library.update(current => ({ ...current, items }));
  const disk = [], search = [], writes = [];
  for (let i = 0; i < 30; i++) { let start = performance.now(); const catalogue = await library.read(); disk.push(performance.now() - start); start = performance.now(); searchCatalogue(catalogue.items, 'rain reflections'); search.push(performance.now() - start); }
  for (let i = 0; i < 7; i++) { const start = performance.now(); await library.update(current => current); writes.push(performance.now() - start); }
  async function footprint(dir) { let bytes = 0, files = 0; for (const entry of await fs.readdir(dir, { withFileTypes: true })) { if (entry.isSymbolicLink()) continue; const file = path.join(dir, entry.name); if (entry.isDirectory()) { const next = await footprint(file); bytes += next.bytes; files += next.files; } else { bytes += (await fs.stat(file)).size; files++; } } return { bytes, files }; }
  const percentile = (values, p) => Number([...values].sort((a, b) => a - b)[Math.ceil(values.length * p) - 1].toFixed(3));
  const result = { measuredAt: new Date().toISOString(), hostLabel: 'SourceSpool development host (Windows x64; no hostname/user paths exported)', environment: { platform: process.platform, arch: process.arch, osRelease: os.release(), node: process.version, cpu: os.cpus()[0]?.model, memoryGiB: Number((os.totalmem() / 1024 ** 3).toFixed(1)) }, startup: { metric: 'New JS process dynamic import and library read to first actual Ink flush on Windows PTY; tool checks continue with visible feedback; excludes OS process creation', samples: startup.length, medianMs: percentile(startup, .5), maxMs: percentile(startup, 1), rawMs: startup.map(v => Number(v.toFixed(3))), toolsReady: { metric: 'same start through completion of all external-tool version checks', medianMs: percentile(ready, .5), maxMs: percentile(ready, 1) } }, catalogue: { records: 1000, source: 'Synthetic varied metadata written/read through production JSON repository; media payload excluded', read: { samples: disk.length, medianMs: percentile(disk, .5), p95Ms: percentile(disk, .95) }, search: { samples: search.length, medianMs: percentile(search, .5), p95Ms: percentile(search, .95) }, atomicWrite: { samples: writes.length, medianMs: percentile(writes, .5), maxMs: percentile(writes, 1) } }, footprint: { dependencies: await footprint(path.join(project, 'node_modules')), build: await footprint(path.join(project, 'dist')), externalTools: { ytDlpBytes: (await fs.stat(process.env.SOURCESPOOL_YTDLP)).size, ffmpegDirectory: await footprint(path.dirname(process.env.SOURCESPOOL_FFMPEG)) }, runtimeBytes: (await fs.stat(process.execPath)).size, excludes: ['npm cache', 'tool download archives', 'saved media', 'source checkout'] }, baselineComparison: { phase2FixtureStartupMedianMs: 620.126, phase2InMemorySearchP95Ms: 1.255, startupProvisionalTargetMs: 1500, searchProvisionalTargetMs: 50, note: 'Production startup performs actual disk and executable checks; phase 2 printed a synthetic snapshot. Scope differs.' } };
  await fs.writeFile(path.join(project, 'docs', 'production-baseline.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
}
