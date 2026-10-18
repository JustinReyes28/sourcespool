import * as fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { emptyCatalogue, parseCatalogue, relativePath, UserError, validateCatalogue } from '../domain/catalogue.js';
import type { Catalogue, Item } from '../domain/model.js';

const MAX_JSON = 16 * 1024 * 1024;
const missing = (error: unknown) => (error as NodeJS.ErrnoException).code === 'ENOENT';
export interface RecoveryEntry { job: string; item: Item; staged: string; state: 'ready' | 'committed' | 'missing' | 'invalid'; }
interface Journal { version: 1; job: string; item: Item; staged: string; }
export interface LibraryHooks { beforeReplace?: (() => Promise<void>) | undefined; afterPromotion?: (() => Promise<void>) | undefined; }

/** Local NTFS library. All application writes go through one exclusive writer lock. */
export class LocalLibrary {
  readonly root: string;
  private canonical = '';
  constructor(root: string, private hooks: LibraryHooks = {}) { this.root = path.resolve(root); }

  async initialize(): Promise<void> {
    await fs.mkdir(this.root, { recursive: true });
    const info = await fs.lstat(this.root);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new UserError('Choose a real local library directory, not a link.');
    this.canonical = await fs.realpath(this.root);
    for (const folder of ['.staging', '.transactions']) { const target = await this.guard(folder); await fs.mkdir(target, { recursive: true }); await this.guard(folder); }
    await this.withLock(async () => {
      try { await this.read(); }
      catch (error) {
        if (!missing(error)) throw error;
        const hasBackup = await fs.lstat(await this.guard('catalogue.json.bak')).then(() => true).catch(e => { if (missing(e)) return false; throw e; });
        if (hasBackup) throw new UserError('catalogue.json is missing but its backup exists. Restore the checked backup before continuing.', 'catalogue-corrupt');
        await this.replace(emptyCatalogue(), false);
      }
    });
  }

  /** Check every existing component for links/reparse escapes and reject external paths. */
  async guard(relative: string): Promise<string> {
    if (!relative || relative.includes('\\') || path.isAbsolute(relative) || relative.split('/').some(p => !p || p === '.' || p === '..') || /[:\x00-\x1f]/.test(relative)) throw new UserError('The file path must stay inside the library.');
    if (path.resolve(this.root, relative).length > 250) throw new UserError('The Windows path is too long. Choose a shorter library root or naming template.');
    if (!this.canonical) this.canonical = await fs.realpath(this.root);
    if ((await fs.realpath(this.root)).toLocaleLowerCase() !== this.canonical.toLocaleLowerCase() || (await fs.lstat(this.root)).isSymbolicLink()) throw new UserError('The library root changed. Reopen the library.');
    let current = this.root;
    for (const part of relative.split('/')) {
      current = path.join(current, part);
      const stat = await fs.lstat(current).catch(error => { if (missing(error)) return null; throw error; });
      if (stat?.isSymbolicLink()) throw new UserError('Library paths cannot pass through symbolic links or junctions.');
      if (stat) {
        const real = await fs.realpath(current);
        const inside = path.relative(this.canonical, real);
        if (inside.startsWith('..') || path.isAbsolute(inside)) throw new UserError('The resolved file path is outside the library.');
      }
    }
    return current;
  }
  private async jsonFile(relative: string): Promise<string> {
    const file = await this.guard(relative); const stat = await fs.lstat(file);
    if (!stat.isFile() || stat.size > MAX_JSON) throw new UserError('Catalogue or journal is not a regular file below 16 MiB.', 'catalogue-corrupt');
    return fs.readFile(file, 'utf8');
  }
  async read(): Promise<Catalogue> { return parseCatalogue(await this.jsonFile('catalogue.json')); }
  async load(): Promise<Catalogue> { return this.read(); }
  private async durable(relative: string, contents: string): Promise<void> {
    const handle = await fs.open(await this.guard(relative), 'wx');
    try { await handle.writeFile(contents, 'utf8'); await handle.sync(); } finally { await handle.close(); }
  }
  private async replace(catalogue: Catalogue, backup = true): Promise<void> {
    const contents = JSON.stringify(validateCatalogue(catalogue), null, 2) + '\n';
    if (Buffer.byteLength(contents) > MAX_JSON) throw new UserError('Catalogue exceeds 16 MiB. Reduce the catalogue before saving.');
    const nonce = randomUUID(); const temp = `.catalogue-${nonce}.tmp`;
    await this.durable(temp, contents);
    try {
      if (backup) {
        const old = await this.jsonFile('catalogue.json'); parseCatalogue(old);
        const backupTemp = `.backup-${nonce}.tmp`;
        await this.durable(backupTemp, old);
        try { await fs.rename(await this.guard(backupTemp), await this.guard('catalogue.json.bak')); }
        catch (error) { await fs.unlink(await this.guard(backupTemp)).catch(() => {}); throw error; }
      }
      await this.hooks.beforeReplace?.();
      // Same-volume rename replaces atomically on supported local NTFS; never unlink the live index.
      await fs.rename(await this.guard(temp), await this.guard('catalogue.json'));
    } finally { await fs.unlink(await this.guard(temp)).catch(error => { if (!missing(error)) throw error; }); }
  }
  private async withLock<T>(action: () => Promise<T>): Promise<T> {
    const token = randomUUID(); let handle: fs.FileHandle;
    try { handle = await fs.open(await this.guard('.writer.lock'), 'wx'); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new UserError('The library is locked by another process or an interrupted writer. Retry after it exits, or inspect Recover → writer lock.', 'catalogue-conflict'); throw error; }
    try {
      await handle.writeFile(JSON.stringify({ pid: process.pid, token, createdAt: new Date().toISOString() })); await handle.sync();
      return await action();
    } finally {
      await handle.close();
      const lock = await this.jsonFile('.writer.lock').then(JSON.parse).catch(() => null) as { token?: string } | null;
      if (lock?.token === token) await fs.unlink(await this.guard('.writer.lock'));
    }
  }
  async lockStatus(): Promise<{ pid: number; alive: boolean; createdAt: string } | null> {
    let value: { pid: number; createdAt: string };
    try { value = JSON.parse(await this.jsonFile('.writer.lock')) as typeof value; } catch (error) { if (missing(error)) return null; throw new UserError('The writer lock is unreadable. Keep it and inspect it manually.'); }
    if (!Number.isInteger(value.pid) || value.pid <= 0 || !Number.isFinite(Date.parse(value.createdAt))) throw new UserError('The writer lock is invalid. Inspect it manually; it was not removed.');
    let alive = true;
    try { process.kill(value.pid, 0); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ESRCH') alive = false; }
    return { ...value, alive };
  }
  async releaseStaleLock(): Promise<void> {
    const before = await this.jsonFile('.writer.lock'); const status = await this.lockStatus();
    if (!status || status.alive || Date.now() - Date.parse(status.createdAt) < 2000) throw new UserError('The writer may still be active. Close the other process and retry.');
    if (await this.jsonFile('.writer.lock') !== before) throw new UserError('The writer lock changed. Retry inspection.');
    await fs.unlink(await this.guard('.writer.lock'));
  }
  async update(change: (catalogue: Catalogue) => Catalogue | Promise<Catalogue>): Promise<Catalogue> {
    return this.withLock(async () => {
      const current = await this.read(); const next = validateCatalogue(await change(structuredClone(current)));
      next.revision = current.revision + 1; await this.replace(next); return next;
    });
  }
  async save(catalogue: Catalogue, expectedRevision: number): Promise<void> {
    await this.update(current => { if (current.revision !== expectedRevision) throw new UserError('The catalogue changed. Reload before saving.', 'catalogue-conflict'); return catalogue; });
  }
  async createStaging(job = randomUUID()): Promise<{ job: string; directory: string }> {
    if (!/^[a-f0-9-]{36}$/.test(job)) throw new UserError('Invalid job identity.');
    const directory = await this.guard(`.staging/${job}`); await fs.mkdir(directory); return { job, directory };
  }
  async discardJob(job: string): Promise<void> {
    if (!/^[a-f0-9-]{36}$/.test(job)) throw new UserError('Invalid job identity.');
    const relative = `.staging/${job}`; const directory = await this.guard(relative);
    const entries = await fs.readdir(directory, { withFileTypes: true }).catch(error => { if (missing(error)) return []; throw error; });
    for (const entry of entries) {
      if (!entry.isFile() || entry.isSymbolicLink()) throw new UserError('Unexpected staged directory or link. Keep it for manual inspection.');
      await fs.unlink(await this.guard(`${relative}/${entry.name}`));
    }
    await fs.rmdir(directory).catch(error => { if (!missing(error)) throw error; });
  }
  async verify(absolute: string, signal?: AbortSignal): Promise<{ bytes: number; sha256: string }> {
    const relative = path.relative(this.root, absolute).split(path.sep).join('/'); const file = await this.guard(relative);
    const stat = await fs.lstat(file);
    if (!stat.isFile() || stat.size < 1) throw new UserError('The downloaded file is empty or incomplete. Retry the download.', 'verification-failure');
    signal?.throwIfAborted(); const hash = createHash('sha256'); let bytes = 0;
    for await (const chunk of createReadStream(file, signal ? { signal } : {})) { signal?.throwIfAborted(); bytes += chunk.length; hash.update(chunk); }
    const after = await fs.lstat(file);
    if (bytes !== stat.size || after.size !== stat.size || after.mtimeMs !== stat.mtimeMs || after.ino !== stat.ino) throw new UserError('The media file changed during verification. Retry.', 'verification-failure');
    return { bytes, sha256: hash.digest('hex') };
  }
  async commitFile(item: Item, stagedAbsolute: string, job: string, allowDuplicate: boolean, signal: AbortSignal, committing: () => void): Promise<{ item: Item; keptExisting: boolean }> {
    const staged = path.relative(this.root, stagedAbsolute).split(path.sep).join('/');
    if (!staged.startsWith(`.staging/${job}/`) || staged.split('/').length !== 3) throw new UserError('Unexpected staged file path.');
    let result = { item, keptExisting: false };
    await this.withLock(async () => {
      const current = await this.read();
      const existing = current.items.find(row => row.hash === item.hash);
      if (existing && !allowDuplicate) throw new UserError('Another save added matching content. Retry to choose how to handle the duplicate.', 'catalogue-conflict');
      const verified = await this.verify(await this.guard(staged), signal);
      if (verified.sha256 !== item.hash || verified.bytes !== item.bytes) throw new UserError('The staged media changed before commit.', 'verification-failure');
      if (!current.collections.some(c => c.id === item.collectionId)) throw new UserError('The selected collection no longer exists. Reload and retry.');
      signal.throwIfAborted();
      let candidate = relativePath(item.relativePath); let counter = 1;
      const ext = path.posix.extname(candidate); const stem = candidate.slice(0, -ext.length);
      // Journal before promotion; link() atomically allocates the destination without overwrite.
      for (;;) {
        const destination = await this.guard(candidate); await fs.mkdir(path.dirname(destination), { recursive: true }); await this.guard(candidate);
        if (current.items.some(row => row.relativePath.toLocaleLowerCase() === candidate.toLocaleLowerCase())) { candidate = relativePath(`${stem}-${++counter}${ext}`); continue; }
        const finalItem = { ...item, relativePath: candidate };
        validateCatalogue({ ...current, items: [...current.items, finalItem] });
        const journal: Journal = { version: 1, job, item: finalItem, staged };
        const journalPath = `.transactions/${job}.json`;
        committing();
        await this.durable(journalPath, JSON.stringify(journal));
        try { await fs.link(await this.guard(staged), destination); }
        catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
          await fs.unlink(await this.guard(journalPath)); candidate = relativePath(`${stem}-${++counter}${ext}`); continue;
        }
        await this.hooks.afterPromotion?.();
        const final = await this.verify(destination);
        if (final.sha256 !== item.hash || final.bytes !== item.bytes) throw new UserError('Promoted file verification failed. Open Recover before retrying.', 'recovery-required');
        await this.replace({ ...current, revision: current.revision + 1, items: [...current.items, finalItem] });
        await fs.unlink(await this.guard(journalPath)); result = { item: finalItem, keptExisting: false }; break;
      }
    });
    await this.discardJob(job); return result;
  }
  async recovery(): Promise<RecoveryEntry[]> {
    const current = await this.read(); const directory = await this.guard('.transactions'); const rows: RecoveryEntry[] = [];
    for (const name of await fs.readdir(directory)) {
      if (!/^[a-f0-9-]{36}\.json$/.test(name)) throw new UserError('Unexpected recovery file. Inspect .transactions manually.');
      const job = name.slice(0, -5);
      const journal = JSON.parse(await this.jsonFile(`.transactions/${name}`)) as Journal;
      if (journal.version !== 1 || journal.job !== job || !journal.staged.startsWith(`.staging/${job}/`) || journal.staged.split('/').length !== 3) throw new UserError('Invalid recovery journal. Keep it for manual inspection.');
      const isolated = validateCatalogue({ ...current, items: [journal.item] }); const item = isolated.items[0]!;
      let state: RecoveryEntry['state'] = current.items.some(row => row.id === item.id && row.hash === item.hash && row.relativePath === item.relativePath) ? 'committed' : 'ready';
      try { const v = await this.verify(await this.guard(item.relativePath)); if (v.sha256 !== item.hash || v.bytes !== item.bytes) state = 'invalid'; }
      catch (error) { if (missing(error)) state = 'missing'; else state = 'invalid'; }
      rows.push({ job, item, staged: journal.staged, state });
    }
    return rows;
  }
  async recover(job: string, choice: 'recover' | 'unlisted'): Promise<void> {
    await this.withLock(async () => {
      const entry = (await this.recovery()).find(row => row.job === job);
      if (!entry) throw new UserError('Recovery job no longer exists. Reload.');
      const current = await this.read();
      if (choice === 'recover' && entry.state !== 'committed') {
        if (entry.state !== 'ready') throw new UserError('The final file is missing or changed. Restore the expected file before recovering.');
        if (current.items.some(row => row.id === entry.item.id || row.relativePath.toLocaleLowerCase() === entry.item.relativePath.toLocaleLowerCase())) throw new UserError('Recovery conflicts with an existing record. Keep the file unlisted or inspect manually.');
        await this.replace({ ...current, revision: current.revision + 1, items: [...current.items, entry.item] });
      }
      await fs.unlink(await this.guard(`.transactions/${job}.json`));
    });
    await this.discardJob(job);
  }
  async status(item: Item): Promise<'present' | 'missing' | 'changed'> {
    try { const stat = await fs.lstat(await this.guard(relativePath(item.relativePath))); return stat.isFile() && stat.size === item.bytes ? 'present' : 'changed'; }
    catch (error) { if (missing(error)) return 'missing'; throw error; }
  }
  async exportTo(destination: string): Promise<void> {
    const file = path.resolve(destination);
    const rel = path.relative(this.root, file).split(path.sep).join('/');
    if (!rel.startsWith('../') && !path.isAbsolute(rel)) { relativePath(rel); if (['catalogue.json', 'catalogue.json.bak'].includes(rel.toLowerCase()) || rel.startsWith('.')) throw new UserError('Choose an export file outside library internals.'); await this.guard(rel); }
    const handle = await fs.open(file, 'wx');
    try { await handle.writeFile(JSON.stringify(await this.read(), null, 2) + '\n'); await handle.sync(); } finally { await handle.close(); }
  }
  async importPreview(file: string): Promise<{ incoming: Catalogue; added: number; conflicts: number; missing: number }> {
    const stat = await fs.lstat(file); if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_JSON) throw new UserError('Choose a regular catalogue JSON file below 16 MiB.');
    const incoming = parseCatalogue(await fs.readFile(file, 'utf8')); const current = await this.read();
    let absent = 0; for (const item of incoming.items) if (await this.status(item) !== 'present') absent++;
    const conflicts = incoming.items.filter(item => current.items.some(row => row.id === item.id && JSON.stringify(row) !== JSON.stringify(item))).length + incoming.collections.filter(c => current.collections.some(row => row.id === c.id && JSON.stringify(row) !== JSON.stringify(c))).length;
    return { incoming, added: incoming.items.filter(item => !current.items.some(row => row.id === item.id)).length, conflicts, missing: absent };
  }
  async importCatalogue(incoming: Catalogue, policy: 'keep' | 'incoming'): Promise<Catalogue> {
    validateCatalogue(incoming);
    return this.update(current => {
      const merge = <T extends { id: string }>(old: T[], next: T[]) => { const map = new Map(old.map(row => [row.id, row])); for (const row of next) if (policy === 'incoming' || !map.has(row.id)) map.set(row.id, row); return [...map.values()]; };
      return { ...current, collections: merge(current.collections, incoming.collections), items: merge(current.items, incoming.items) };
    });
  }
}
