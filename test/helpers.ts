import * as fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { LocalLibrary } from '../src/adapters/local-library.js';
import type { LibraryHooks } from '../src/adapters/local-library.js';
import type { Item, Metadata, Draft } from '../src/domain/model.js';
import type { DownloadAdapter, DownloadRequest } from '../src/ports/index.js';
import { DEFAULT_TEMPLATE } from '../src/domain/catalogue.js';

export async function temporaryLibrary(hooks: LibraryHooks = {}) {
  const base = path.resolve('.tmp'); await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'test library 雨 '));
  const library = new LocalLibrary(directory, hooks); await library.initialize();
  return { library, directory, async cleanup() {
    const relative = path.relative(base, path.resolve(directory));
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || (await fs.lstat(directory)).isSymbolicLink()) throw new Error('Unsafe test cleanup target');
    await fs.rm(directory, { recursive: true, force: true });
  } };
}
export const metadata = (url = 'https://example.org/reference.mp4'): Metadata => ({ sourceUrl: url, extractor: 'test', sourceId: url, title: 'Rain reflections 雨', formats: [{ id: 'mp4', extension: 'mp4', label: 'Video · MP4' }] });
export const draft = (url = 'https://example.org/reference.mp4'): Draft => ({ sourceUrl: url, formatId: 'mp4', collectionId: 'field-notes', tags: 'rain, texture', notes: 'Look at the reflections.' });
export class FileDownloader implements DownloadAdapter {
  calls = 0;
  constructor(public content = 'original test bytes', private slow = false) {}
  async inspect(url: string, signal: AbortSignal) { signal.throwIfAborted(); return metadata(url); }
  async download(request: DownloadRequest, signal: AbortSignal, progress: (p: number) => void) {
    this.calls++; signal.throwIfAborted();
    const absolutePath = path.join(request.stagingDirectory, 'media.mp4'); await fs.writeFile(absolutePath, this.content);
    if (this.slow) await new Promise<void>((resolve, reject) => { if (signal.aborted) reject(new DOMException('Cancelled', 'AbortError')); else signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')), { once: true }); });
    progress(90); signal.throwIfAborted(); return { absolutePath, extension: 'mp4' };
  }
}
export async function stagedItem(library: LocalLibrary, content = 'completed reference', relative = 'field-notes/reference.mp4') {
  const staging = await library.createStaging(); const absolute = path.join(staging.directory, 'media.mp4');
  await fs.writeFile(absolute, content);
  const item: Item = { id: randomUUID(), sourceUrl: 'https://example.org/reference.mp4', title: 'Original reference', sourceIdentity: { extractor: 'test', sourceId: 'reference', formatId: 'mp4' }, createdAt: new Date().toISOString(), relativePath: relative, bytes: Buffer.byteLength(content), hash: createHash('sha256').update(content).digest('hex'), tags: ['rain'], notes: 'Look at the reflections.', collectionId: 'field-notes' };
  return { ...staging, absolute, item };
}
export { DEFAULT_TEMPLATE };
