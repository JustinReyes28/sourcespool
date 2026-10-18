import { randomUUID } from 'node:crypto';
import { DEFAULT_TEMPLATE, emptyCatalogue, errorMessage, namingPath, safeComponent, searchCatalogue, sourceUrl, UserError, validateTemplate } from '../domain/catalogue.js';
import type { Catalogue, Draft, Item, Metadata } from '../domain/model.js';
import { openItem } from '../adapters/opener.js';
import type { RecoveryEntry } from '../adapters/local-library.js';
import type { ToolVersions, YtDlpDownloader } from '../adapters/downloader.js';
import { LibraryService } from './library-service.js';
import type { DuplicateChoice } from './library-service.js';

export type Page = 'home' | 'url' | 'format' | 'organize' | 'review' | 'progress' | 'duplicate' | 'completed' | 'library' | 'details' | 'settings' | 'collection' | 'export' | 'import' | 'import-review' | 'recovery' | 'failure' | 'cancelled';
export interface ProductionState {
  page: Page; catalogue: Catalogue; draft: Draft; metadata: Metadata | null; field: number; selected: number; cursor: number;
  search: string; input: string; notice: string; error: string; busy: boolean; work: string; percent: number | null;
  itemId: string | null; fileStatus: string; duplicate: { item: Item; reason: 'source' | 'hash' } | null;
  recovery: RecoveryEntry[]; lock: { pid: number; alive: boolean; createdAt: string } | null;
  importData: { incoming: Catalogue; added: number; conflicts: number; missing: number } | null;
  versions: ToolVersions | null; previewId: string; previewDate: string; template: string; cancelRequested: boolean; exitRequested: boolean; canExit: boolean;
}
export class ApplicationController {
  private listeners = new Set<() => void>();
  private abort: AbortController | null = null;
  private chooseDuplicate: ((choice: DuplicateChoice) => void) | null = null;
  private active: Promise<void> | null = null;
  state: ProductionState;
  constructor(readonly service: LibraryService) {
    this.state = { page: 'home', catalogue: emptyCatalogue(), draft: { sourceUrl: '', formatId: '', collectionId: 'field-notes', tags: '', notes: '' }, metadata: null, field: 0, selected: 0, cursor: 0, search: '', input: '', notice: '', error: '', busy: false, work: '', percent: null, itemId: null, fileStatus: '', duplicate: null, recovery: [], lock: null, importData: null, versions: null, previewId: randomUUID(), previewDate: new Date().toISOString(), template: DEFAULT_TEMPLATE, cancelRequested: false, exitRequested: false, canExit: false };
  }
  snapshot = (): ProductionState => this.state;
  subscribe = (listener: () => void): (() => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  patch(change: Partial<ProductionState>): void { this.state = { ...this.state, ...change }; for (const listener of this.listeners) listener(); }
  async initialize(checkTools = true): Promise<void> {
    try { await this.service.library.initialize(); await this.reload(); }
    catch (error) { this.patch({ error: errorMessage(error) }); return; }
    if (checkTools) await this.checkTools();
  }
  async checkTools(): Promise<void> {
    this.patch({ work: 'checking-tools', notice: 'Checking installed downloader tools…' });
    this.start(async signal => {
      try { const versions = await (this.service.downloader as YtDlpDownloader).check?.(signal); signal.throwIfAborted(); this.patch({ versions: versions ?? null, notice: versions ? `Tools ready · yt-dlp ${versions.ytDlp}` : '' }); }
      catch (error) { if (signal.aborted) throw error; this.patch({ notice: errorMessage(error) }); }
    });
    if (this.state.busy) this.patch({ notice: 'Checking installed downloader tools…' });
    await this.waitForIdle();
  }
  private async reload(): Promise<void> { this.patch({ catalogue: await this.service.library.read(), recovery: await this.service.library.recovery() }); }
  navigate(page: Page): void {
    if (this.state.busy) return;
    const collection = this.state.catalogue.collections.find(c => c.id === this.state.draft.collectionId) ?? this.state.catalogue.collections[0]!;
    this.patch({ page, notice: '', error: '', selected: 0, field: 0, input: '', template: collection.namingTemplate, draft: { ...this.state.draft, collectionId: collection.id } });
    this.patch({ cursor: [...this.fieldValue()].length });
  }
  fieldValue(): string {
    const { page, draft } = this.state;
    return page === 'url' ? draft.sourceUrl : page === 'organize' ? this.state.field === 0 ? draft.tags : draft.notes : page === 'library' ? this.state.search : page === 'settings' ? this.state.template : this.state.input;
  }
  moveCursor(direction: number | 'home' | 'end'): void {
    const length = [...this.fieldValue()].length;
    this.patch({ cursor: direction === 'home' ? 0 : direction === 'end' ? length : Math.max(0, Math.min(length, this.state.cursor + direction)) });
  }
  nextField(): void { this.patch({ field: this.state.field === 0 ? 1 : 0 }); this.moveCursor('end'); }
  edit(value: string, clear = false, backspace = false, deleteForward = false): void {
    if (this.state.busy) return;
    let nextCursor = this.state.cursor;
    const append = (old: string, max = 4096) => {
      const characters = [...old]; const cursor = Math.min(this.state.cursor, characters.length);
      const inserted = [...value.replace(/[\x00-\x1f\x7f-\x9f]/g, '')].slice(0, Math.max(0, max - characters.length));
      if (clear) { nextCursor = 0; return ''; }
      if (backspace) { nextCursor = Math.max(0, cursor - 1); if (cursor > 0) characters.splice(cursor - 1, 1); }
      else if (deleteForward) { nextCursor = cursor; characters.splice(cursor, 1); }
      else { characters.splice(cursor, 0, ...inserted); nextCursor = cursor + inserted.length; }
      return characters.join('');
    };
    const { page, draft } = this.state;
    if (page === 'url') this.patch({ draft: { ...draft, sourceUrl: append(draft.sourceUrl) }, error: '' });
    if (page === 'organize') { const field = this.state.field === 0 ? 'tags' : 'notes'; this.patch({ draft: { ...draft, [field]: append(draft[field], field === 'notes' ? 4000 : 2000) }, error: '' }); }
    if (page === 'library') this.patch({ search: append(this.state.search, 300), selected: 0 });
    if (page === 'settings') this.patch({ template: append(this.state.template, 150), error: '' });
    if (['export', 'import', 'collection'].includes(page)) this.patch({ input: append(this.state.input, page === 'collection' ? 100 : 4096), error: '' });
    this.patch({ cursor: nextCursor });
  }
  results(): Item[] { return searchCatalogue(this.state.catalogue.items, this.state.search); }
  preview(): string {
    const collection = this.state.catalogue.collections.find(c => c.id === this.state.draft.collectionId)!;
    const format = this.state.metadata?.formats.find(f => f.id === this.state.draft.formatId);
    try { return namingPath({ ...collection, namingTemplate: this.state.page === 'settings' ? this.state.template : collection.namingTemplate }, this.state.metadata?.title ?? 'Example reference', this.state.previewId, format?.extension ?? 'mp4', this.state.previewDate); } catch (error) { return errorMessage(error); }
  }
  cycleCollection(direction = 1): void {
    if (this.state.busy) return;
    const rows = this.state.catalogue.collections; const index = rows.findIndex(c => c.id === this.state.draft.collectionId);
    const collection = rows[(index + direction + rows.length) % rows.length]!;
    this.patch({ draft: { ...this.state.draft, collectionId: collection.id }, template: collection.namingTemplate });
  }
  move(direction: number): void {
    const total = this.state.page === 'format' ? this.state.metadata?.formats.length ?? 0 : this.state.page === 'recovery' ? this.state.recovery.length : this.results().length;
    const selected = Math.max(0, Math.min(total - 1, this.state.selected + direction));
    this.patch({ selected, ...(this.state.page === 'format' ? { draft: { ...this.state.draft, formatId: this.state.metadata?.formats[selected]?.id ?? '' } } : {}) });
  }
  back(): void {
    if (this.state.busy) { this.cancel(); return; }
    const pages: Partial<Record<Page, Page>> = { url: 'home', format: 'url', organize: 'format', review: 'organize', details: 'library', completed: 'home', failure: 'url', cancelled: 'url', 'import-review': 'import' };
    this.patch({ page: pages[this.state.page] ?? 'home', error: '', notice: '' });
  }
  private start(task: (signal: AbortSignal) => Promise<void>): void {
    if (this.state.busy) return;
    const abort = new AbortController(); this.abort = abort;
    this.patch({ busy: true, error: '', notice: '', cancelRequested: false });
    this.active = (async () => {
      try { await task(abort.signal); }
      catch (error) { this.patch({ page: abort.signal.aborted && (error as Error).name === 'AbortError' ? 'cancelled' : 'failure', error: errorMessage(error), duplicate: null }); }
      finally { this.abort = null; this.chooseDuplicate = null; this.active = null; this.patch({ busy: false, canExit: this.state.exitRequested }); }
    })();
  }
  async waitForIdle(): Promise<void> { await this.active; }
  cancel(exit = false): void {
    if (!this.state.busy) { if (exit) this.patch({ exitRequested: true, canExit: true }); return; }
    this.patch({ cancelRequested: true, exitRequested: this.state.exitRequested || exit, notice: this.state.work === 'committing' ? 'Finishing save; cancellation requested. The actual saved or recovery outcome will be shown.' : 'Stopping the downloader and keeping your draft…' });
    if (this.state.work !== 'committing') { this.abort?.abort(); this.chooseDuplicate?.('cancel'); }
  }
  choose(choice: DuplicateChoice): void { const resolve = this.chooseDuplicate; this.chooseDuplicate = null; resolve?.(choice); }
  async continue(): Promise<void> {
    if (this.state.busy) return;
    try {
      switch (this.state.page) {
        case 'url': {
          const url = sourceUrl(this.state.draft.sourceUrl);
          this.patch({ page: 'progress', work: 'inspecting', percent: null });
          this.start(async signal => {
            const metadata = await this.service.inspect(url, signal); signal.throwIfAborted();
            const selected = Math.max(0, metadata.formats.findIndex(format => format.id === this.state.draft.formatId));
            this.patch({ metadata, page: 'format', selected, draft: { ...this.state.draft, sourceUrl: metadata.sourceUrl, formatId: metadata.formats[selected]!.id }, previewId: randomUUID(), previewDate: new Date().toISOString() });
          }); break;
        }
        case 'format': this.patch({ page: 'organize', field: 0, cursor: [...this.state.draft.tags].length }); break;
        case 'organize': this.patch({ page: 'review' }); break;
        case 'review': {
          if (!this.state.metadata) throw new UserError('Read the source before saving.');
          const metadata = this.state.metadata; const draft = { ...this.state.draft };
          this.patch({ page: 'progress', work: 'downloading', percent: 0 });
          this.start(async signal => {
            const result = await this.service.save(draft, metadata, signal, {
              progress: (work, percent) => this.patch({ page: 'progress', work, percent }),
              duplicate: (item, reason) => new Promise<DuplicateChoice>(resolve => { this.chooseDuplicate = resolve; this.patch({ page: 'duplicate', duplicate: { item, reason } }); if (signal.aborted) this.choose('cancel'); })
            }, { id: this.state.previewId, createdAt: this.state.previewDate });
            await this.reload(); this.patch({ page: 'completed', itemId: result.item.id, duplicate: null, notice: result.keptExisting ? 'Kept the existing reference. No additional file or record was added.' : 'Saved and verified. Source, tags and notes are now searchable.', percent: 100 });
          }); break;
        }
        case 'completed': this.navigate('library'); break;
        case 'library': { const item = this.results()[this.state.selected]; if (item) { const fileStatus = await this.service.library.status(item); this.patch({ page: 'details', itemId: item.id, fileStatus }); } break; }
        case 'settings': {
          const template = validateTemplate(this.state.template); const id = this.state.draft.collectionId;
          await this.service.library.update(current => ({ ...current, collections: current.collections.map(c => c.id === id ? { ...c, namingTemplate: template } : c) }));
          await this.reload(); this.patch({ notice: 'Naming template saved for this collection.' }); break;
        }
        case 'collection': {
          const name = this.state.input.trim(); if (!name || name.length > 100) throw new UserError('Enter a collection name below 100 characters.');
          let id = safeComponent(name, 30).toLowerCase().replace(/[^a-z0-9_-]/g, '-'); if (!id) id = 'collection';
          const base = id; let count = 1; while (this.state.catalogue.collections.some(c => c.id === id)) id = `${base}-${++count}`;
          const chosenId = id;
          await this.service.library.update(current => ({ ...current, collections: [...current.collections, { id: chosenId, name, namingTemplate: DEFAULT_TEMPLATE }] }));
          await this.reload(); this.patch({ page: 'home', draft: { ...this.state.draft, collectionId: chosenId }, notice: `Created ${name}.` }); break;
        }
        case 'export': await this.service.library.exportTo(this.state.input.trim()); this.patch({ notice: 'Catalogue exported. Media files must be backed up separately.' }); break;
        case 'import': { const importData = await this.service.library.importPreview(this.state.input.trim()); this.patch({ page: 'import-review', importData }); break; }
        case 'failure': case 'cancelled': this.navigate('url'); break;
      }
    } catch (error) { this.patch({ error: errorMessage(error) }); }
  }
  async importChoice(policy: 'keep' | 'incoming'): Promise<void> {
    if (!this.state.importData || this.state.busy) return;
    try { await this.service.library.importCatalogue(this.state.importData.incoming, policy); await this.reload(); this.patch({ page: 'library', notice: 'Metadata imported. Missing media stays listed; copy files separately to restore it.', importData: null }); }
    catch (error) { this.patch({ error: errorMessage(error) }); }
  }
  async open(kind: 'file' | 'source'): Promise<void> {
    const item = this.state.catalogue.items.find(i => i.id === this.state.itemId); if (!item) return;
    try { await openItem(this.service.library, item, kind); this.patch({ notice: `Requested Windows to open the ${kind}.` }); } catch (error) { this.patch({ error: errorMessage(error) }); }
  }
  async recoveryPage(): Promise<void> {
    if (this.state.busy) return;
    try { this.patch({ page: 'recovery', lock: await this.service.library.lockStatus(), selected: 0, error: '' }); this.patch({ recovery: await this.service.library.recovery() }); }
    catch (error) { this.patch({ page: 'recovery', error: errorMessage(error) }); }
  }
  async recover(choice: 'recover' | 'unlisted' | 'unlock'): Promise<void> {
    try {
      if (choice === 'unlock') await this.service.library.releaseStaleLock();
      else { const entry = this.state.recovery[this.state.selected]; if (!entry) return; await this.service.library.recover(entry.job, choice); }
      await this.service.library.initialize(); await this.reload(); await this.recoveryPage(); this.patch({ notice: choice === 'unlock' ? 'Stale writer lock removed after checking its process.' : 'Recovery choice completed. Existing media was preserved.' });
    } catch (error) { this.patch({ error: errorMessage(error) }); }
  }
}
