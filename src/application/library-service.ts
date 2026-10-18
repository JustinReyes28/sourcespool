import { randomUUID } from 'node:crypto';
import { cleanText, namingPath, sourceUrl, UserError } from '../domain/catalogue.js';
import type { Draft, Item, Metadata } from '../domain/model.js';
import type { DownloadAdapter } from '../ports/index.js';
import { LocalLibrary } from '../adapters/local-library.js';

export type DuplicateChoice = 'existing' | 'another' | 'cancel';
export interface SaveCallbacks {
  progress: (stage: 'downloading' | 'verifying' | 'committing', percent: number | null) => void;
  duplicate: (item: Item, reason: 'source' | 'hash') => Promise<DuplicateChoice>;
}
/** Coordinates actual downloads. The UI never manufactures a completed record. */
export class LibraryService {
  constructor(readonly library: LocalLibrary, readonly downloader: DownloadAdapter) {}
  inspect(url: string, signal: AbortSignal): Promise<Metadata> { return this.downloader.inspect(sourceUrl(url), signal); }
  async save(draft: Draft, metadata: Metadata, signal: AbortSignal, callbacks: SaveCallbacks, identity: { id: string; createdAt: string } = { id: randomUUID(), createdAt: new Date().toISOString() }): Promise<{ item: Item; keptExisting: boolean }> {
    if (sourceUrl(draft.sourceUrl) !== metadata.sourceUrl) throw new UserError('The URL changed. Read the source again before saving.');
    const format = metadata.formats.find(f => f.id === draft.formatId); if (!format) throw new UserError('Select an available format.');
    const catalogue = await this.library.read(); const collection = catalogue.collections.find(c => c.id === draft.collectionId);
    if (!collection) throw new UserError('Choose an existing collection.');
    const tags = [...new Set(draft.tags.split(',').map(t => cleanText(t.trim())).filter(Boolean))]; const notes = cleanText(draft.notes);
    if (tags.length > 50 || tags.some(t => t.length > 80) || notes.length > 4000) throw new UserError('Use up to 50 short tags and a note below 4,000 characters.');
    const sameSource = catalogue.items.find(i => i.sourceIdentity.extractor === metadata.extractor && i.sourceIdentity.sourceId === metadata.sourceId && i.sourceIdentity.formatId === draft.formatId);
    if (sameSource) { const choice = await callbacks.duplicate(sameSource, 'source'); signal.throwIfAborted(); if (choice === 'existing') return { item: sameSource, keptExisting: true }; if (choice === 'cancel') throw new DOMException('Cancelled', 'AbortError'); }
    const staging = await this.library.createStaging(); let commitStarted = false;
    try {
      callbacks.progress('downloading', 0);
      const file = await this.downloader.download({ sourceUrl: metadata.sourceUrl, formatId: format.id, stagingDirectory: staging.directory }, signal, percent => callbacks.progress('downloading', percent));
      callbacks.progress('verifying', null); const verified = await this.library.verify(file.absolutePath, signal);
      const latest = await this.library.read(); const sameHash = latest.items.find(i => i.hash === verified.sha256); let allowDuplicate = false;
      if (sameHash) { const choice = await callbacks.duplicate(sameHash, 'hash'); signal.throwIfAborted(); if (choice === 'existing') { await this.library.discardJob(staging.job); return { item: sameHash, keptExisting: true }; } if (choice === 'cancel') throw new DOMException('Cancelled', 'AbortError'); allowDuplicate = true; }
      signal.throwIfAborted(); const { createdAt, id } = identity;
      const item: Item = { id, sourceUrl: metadata.sourceUrl, title: cleanText(metadata.title).slice(0, 500), sourceIdentity: { extractor: metadata.extractor, sourceId: metadata.sourceId, formatId: format.id }, createdAt, relativePath: namingPath(collection, metadata.title, id, file.extension, createdAt), bytes: verified.bytes, hash: verified.sha256, tags, notes, collectionId: collection.id };
      return await this.library.commitFile(item, file.absolutePath, staging.job, allowDuplicate, signal, () => { commitStarted = true; callbacks.progress('committing', null); });
    } catch (error) {
      if (error instanceof UserError && error.category === 'cancellation-failure') throw error;
      if (!commitStarted) await this.library.discardJob(staging.job);
      else throw new UserError('The save needs recovery. Open Recover to inspect the verified file and catalogue before retrying.', 'recovery-required');
      throw error;
    }
  }
}
