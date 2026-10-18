import * as fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
const run = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const destination = path.join(root, '.tmp', 'release'); await fs.mkdir(destination, { recursive: true });
const name = `sourcespool-${pkg.version}-windows-x64-source.zip`; const archive = path.join(destination, name);
// Package the committed release tree; excludes caches, dependencies, tools and private libraries.
await run('git', ['archive', '--format=zip', '--prefix=sourcespool/', `--output=${archive}`, 'HEAD'], { cwd: root });
const hash = createHash('sha256'); for await (const chunk of createReadStream(archive)) hash.update(chunk);
await fs.writeFile(path.join(destination, 'SHA256SUMS.txt'), `${hash.digest('hex')}  ${name}\n`);
const commit = (await run('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim();
await fs.writeFile(path.join(destination, 'BUILD-INFO.json'), JSON.stringify({ version: pkg.version, commit, runtime: process.version, platform: process.platform, architecture: process.arch, externalToolsBundled: false, format: 'source archive; npm ci and npm run build required' }, null, 2) + '\n');
console.log(JSON.stringify({ archive, commit, bytes: (await fs.stat(archive)).size }));
