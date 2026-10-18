import * as fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const run = promisify(execFile);
const root = path.resolve(import.meta.dirname, '..');
const npmCli = process.env.npm_execpath ?? process.env.SOURCESPOOL_NPM_CLI;
if (!npmCli) throw Error('Run through npm run test:package or set SOURCESPOOL_NPM_CLI.');
const online = process.argv.includes('--online');
const base = path.join(root, '.tmp'); await fs.mkdir(base, { recursive: true });
const work = await fs.mkdtemp(path.join(base, 'package test 雨 '));
const cache = online ? path.join(work, 'empty-cache') : path.join(root, '.npm-cache');
const prefix = path.join(work, 'prefix'); const cwd = path.join(work, 'unrelated'); await fs.mkdir(cwd);
const env = { ...process.env, LOCALAPPDATA: path.join(work, 'profile'), npm_config_cache: cache, npm_config_audit: 'false', npm_config_fund: 'false', npm_config_update_notifier: 'false' };
const npm = async args => (await run(process.execPath, [npmCli, ...args], { cwd, env, maxBuffer: 4 * 1024 * 1024 })).stdout;
const packed = JSON.parse((await run(process.execPath, [npmCli, 'pack', '--json', '--pack-destination', work], { cwd: root, env, maxBuffer: 4 * 1024 * 1024 })).stdout)[0];
const names = packed.files.map(f => f.path);
for (const required of ['dist/cli.js', 'dist/adapters/tool-setup.js', 'package.json', 'README.md', 'LICENSE', 'docs/tool-provenance.md']) assert.ok(names.includes(required), required);
assert.ok(names.every(n => !/(^|\/)(node_modules|src|test|\.tmp|\.npm-cache|\.tools)(\/|$)|\.map$|\.(exe|zip|mp4)$/.test(n)));
const tarball = path.join(work, packed.filename); const network = online ? [] : ['--offline'];
await npm(['install', '-g', tarball, '--prefix', prefix, '--ignore-scripts', '--no-audit', '--no-fund', ...network]);
const cli = path.join(prefix, 'node_modules', 'sourcespool', 'dist', 'cli.js');
const execute = async args => (await run(process.execPath, [cli, ...args], { cwd, env })).stdout;
assert.match(await execute(['--help']), /--tool-cache/); assert.match(await execute(['--version']), new RegExp(packed.version.replaceAll('.', '\\.')));
await fs.access(path.join(prefix, 'sourcespool.cmd'));
await assert.rejects(run(process.execPath, [cli, '--not-an-option'], { cwd, env }), e => e.code === 1 && /Unknown option/.test(e.stderr));
assert.equal(await fs.stat(env.LOCALAPPDATA).then(() => true, () => false), false, 'help/version must not write user data');
const registryPackage = process.env.SOURCESPOOL_REGISTRY_PACKAGE;
if (registryPackage) {
  assert.ok((await npm(['exec', '--yes', '--package', registryPackage, '--', 'sourcespool', '--version'])).includes('SourceSpool ' + packed.version));
  await npm(['install', '-g', registryPackage, '--prefix', prefix, '--ignore-scripts', '--no-audit', '--no-fund']);
} else {
  await npm(['exec', '--yes', ...network, '--package', tarball, '--', 'sourcespool', '--version']);
}
const toolCache = process.env.SOURCESPOOL_TOOL_CACHE ?? path.join(root, '.tmp', 'tools');
if (process.argv.includes('--tools')) {
  const args = online ? ['--setup', '--download-tools'] : ['--setup', '--tool-cache', toolCache];
  await execute(args); await execute(['--check-tools']);
  await execute(['--setup']);
  const fixture = path.join(env.LOCALAPPDATA, 'SourceSpool', 'settings.json');
  const library = path.join(work, 'existing library'); await fs.mkdir(library);
  const active = JSON.parse(await fs.readFile(path.join(env.LOCALAPPDATA, 'SourceSpool', 'tools', 'current.json'), 'utf8'));
  const tools = path.join(env.LOCALAPPDATA, 'SourceSpool', 'tools', active.release);
  const settings = { schemaVersion: 1, libraryRoot: library, ytDlp: path.join(tools, 'yt-dlp.exe'), ffmpeg: path.join(tools, 'ffmpeg.exe') };
  await fs.writeFile(fixture, JSON.stringify(settings)); await execute(['--setup']);
  assert.deepEqual(JSON.parse(await fs.readFile(fixture, 'utf8')), settings);
  await npm(['uninstall', '-g', 'sourcespool', '--prefix', prefix, '--no-audit', '--no-fund', ...network]);
  await fs.access(fixture); await fs.access(library); await fs.access(settings.ytDlp);
  await npm(['install', '-g', tarball, '--prefix', prefix, '--ignore-scripts', '--no-audit', '--no-fund', ...network]);
  await execute(['--check-tools']);
}
const releaseCommit = (await run('git', ['-c', 'safe.directory=' + root, 'rev-parse', 'HEAD'], { cwd: root })).stdout.trim();
const evidence = { releaseCommit, testedAt: new Date().toISOString(), version: packed.version, node: process.version, platform: process.platform, os: (await import('node:os')).release(), networkMode: online ? 'hosted clean online' : 'local offline cache', packageBytes: packed.size, sha256: createHash('sha256').update(await fs.readFile(tarball)).digest('hex'), files: names, artifact: path.relative(root, tarball), globalInstall: 'pass', npx: 'pass', lifecycleScriptsDisabled: true, toolSetup: process.argv.includes('--tools') ? 'pass' : 'not requested', registryPackage: registryPackage ?? null, workDirectory: path.relative(root, work) };
await fs.writeFile(path.join(base, 'phase55-package-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify(evidence, null, 2));
