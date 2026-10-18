import type { Catalogue, Collection, Item } from './model.js';

export const DEFAULT_TEMPLATE = '{collection}/{date}-{title}-{id}.{ext}';
export const MEDIA_EXTENSIONS = new Set(['mp4', 'mkv', 'webm', 'mov', 'avi', 'm4v', 'mpeg', 'mpg', 'ogv', 'flv', 'mp3', 'm4a', 'ogg', 'opus', 'wav', 'flac', 'aac', 'aiff', 'alac', 'weba']);
export const emptyCatalogue = (): Catalogue => ({ schemaVersion: 1, revision: 0, collections: [
  { id: 'field-notes', name: 'Field notes', namingTemplate: DEFAULT_TEMPLATE },
  { id: 'studio', name: 'Studio references', namingTemplate: DEFAULT_TEMPLATE }
], items: [] });

export class UserError extends Error {
  constructor(message: string, public readonly category = 'invalid-input') { super(message); this.name = 'UserError'; }
}
export const cleanText = (value: string) => value.replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, '').replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '').replace(/[\x00-\x1f\x7f-\x9f]/g, '');
export function sourceUrl(value: string): string {
  if (typeof value !== 'string' || !value || value.length > 4096 || /[\x00-\x20\x7f-\x9f]/.test(value)) throw new UserError('Enter an http or https URL without spaces or control characters.');
  let url: URL;
  try { url = new URL(value); } catch { throw new UserError('Enter a complete http or https URL.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new UserError('Use an http or https URL without a username or password.');
  return url.href;
}
const reserved = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i;
const badComponent = (part: string) => !part || part === '.' || part === '..' || /[<>:"\\|?*\x00-\x1f\x7f-\x9f]/.test(part) || /[. ]$/.test(part) || reserved.test(part);
export function relativePath(value: unknown): string {
  if (typeof value !== 'string' || value.length > 210 || value.startsWith('/') || value.split('/').some(badComponent)) throw new UserError('Use a relative Windows-safe path inside the library.');
  return value;
}
export function validateTemplate(value: string): string {
  if (!value || value.length > 150 || /[<>:"\\|?*\x00-\x1f\x7f-\x9f]/.test(value)) throw new UserError('Use a short relative template with forward slashes and supported tokens.');
  const tokens = value.match(/\{[^{}]*\}/g) ?? [];
  if (tokens.some(token => !['{collection}', '{date}', '{title}', '{id}', '{ext}'].includes(token)) || /[{}]/.test(value.replace(/\{[^{}]*\}/g, ''))) throw new UserError('Allowed tokens: {collection}, {date}, {title}, {id}, {ext}.');
  if (!value.endsWith('.{ext}')) throw new UserError('End the template with .{ext} to keep the media extension.');
  relativePath(value.replace(/\{[^{}]*\}/g, 'sample'));
  return value;
}
export function safeComponent(value: string, limit = 65): string {
  let result = cleanText(value).normalize('NFKC').replace(/[<>:"/\\|?*]/g, '-').replace(/\s+/g, '-').replace(/^[. ]+|[. ]+$/g, '').slice(0, limit).replace(/[. ]+$/g, '');
  if (!result) result = 'reference';
  if (reserved.test(result)) result = '_' + result;
  return result;
}
export function namingPath(collection: Collection, title: string, id: string, extension: string, createdAt: string): string {
  validateTemplate(collection.namingTemplate);
  const values: Record<string, string> = { collection: safeComponent(collection.id, 40), date: createdAt.slice(0, 10), title: safeComponent(title), id: safeComponent(id, 36), ext: safeComponent(extension, 10) };
  return relativePath(collection.namingTemplate.replace(/\{(\w+)\}/g, (_, token: string) => values[token]!));
}
export function searchCatalogue(items: Item[], query: string): Item[] {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return items.filter(item => terms.every(term => [item.title, item.sourceUrl, item.notes, ...item.tags].join(' ').toLocaleLowerCase().includes(term)));
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new UserError('Invalid catalogue object.', 'catalogue-corrupt');
  return value as Record<string, unknown>;
}
function text(value: unknown, name: string, max = 1000, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && !value) || value.length > max || cleanText(value) !== value) throw new UserError(`Invalid ${name} in catalogue.`, 'catalogue-corrupt');
  return value;
}
function id(value: unknown): string {
  const result = text(value, 'id', 80);
  if (!/^[a-zA-Z0-9_-]+$/.test(result)) throw new UserError('Invalid catalogue id.', 'catalogue-corrupt');
  return result;
}
export function validateCatalogue(value: unknown): Catalogue {
  const obj = record(value);
  if (obj.schemaVersion !== 1) throw new UserError('Unsupported catalogue version. Use a compatible SourceSpool version.', 'catalogue-corrupt');
  if (!Number.isSafeInteger(obj.revision) || Number(obj.revision) < 0 || !Array.isArray(obj.collections) || !Array.isArray(obj.items) || obj.collections.length < 1 || obj.collections.length > 200 || obj.items.length > 10000) throw new UserError('Invalid catalogue envelope or size.', 'catalogue-corrupt');
  const collections: Collection[] = obj.collections.map(value => { const row = record(value); return { id: id(row.id), name: text(row.name, 'collection name', 100), namingTemplate: validateTemplate(text(row.namingTemplate, 'template', 150)) }; });
  const collectionIds = new Set(collections.map(c => c.id));
  if (collectionIds.size !== collections.length) throw new UserError('Duplicate collection ids.', 'catalogue-corrupt');
  const items: Item[] = obj.items.map(value => {
    const row = record(value); const identity = record(row.sourceIdentity);
    const hash = text(row.hash, 'hash', 64);
    if (!/^[a-f0-9]{64}$/.test(hash) || !Number.isSafeInteger(row.bytes) || Number(row.bytes) <= 0 || !Array.isArray(row.tags) || row.tags.length > 50) throw new UserError('Invalid item hash, size or tags.', 'catalogue-corrupt');
    const collectionId = id(row.collectionId);
    if (!collectionIds.has(collectionId)) throw new UserError('Item references an unknown collection.', 'catalogue-corrupt');
    const createdAt = text(row.createdAt, 'creation date', 30);
    if (!Number.isFinite(Date.parse(createdAt)) || new Date(createdAt).toISOString() !== createdAt) throw new UserError('Invalid item date.', 'catalogue-corrupt');
    const tags = row.tags.map(tag => text(tag, 'tag', 80));
    if (new Set(tags).size !== tags.length) throw new UserError('Duplicate tags in catalogue.', 'catalogue-corrupt');
    return { id: id(row.id), title: text(row.title, 'title', 500), sourceUrl: sourceUrl(text(row.sourceUrl, 'URL', 4096)), sourceIdentity: { extractor: text(identity.extractor, 'extractor', 100), sourceId: text(identity.sourceId, 'source id', 300), formatId: text(identity.formatId, 'format', 200) }, createdAt, relativePath: relativePath(row.relativePath), bytes: Number(row.bytes), hash, tags, notes: text(row.notes, 'notes', 4000, true), collectionId };
  });
  if (new Set(items.map(i => i.id)).size !== items.length || new Set(items.map(i => i.relativePath.toLocaleLowerCase())).size !== items.length) throw new UserError('Duplicate item ids or file paths.', 'catalogue-corrupt');
  return { schemaVersion: 1, revision: Number(obj.revision), collections, items };
}
export function parseCatalogue(json: string): Catalogue {
  if (Buffer.byteLength(json) > 16 * 1024 * 1024) throw new UserError('Catalogue exceeds the 16 MiB safety limit.', 'catalogue-corrupt');
  try { return validateCatalogue(JSON.parse(json)); } catch (error) { if (error instanceof UserError) throw error; throw new UserError('Catalogue is not valid JSON. Restore catalogue.json.bak after checking it.', 'catalogue-corrupt'); }
}
export function errorMessage(error: unknown): string {
  if (error instanceof UserError) return error.message;
  const code = (error as NodeJS.ErrnoException)?.code;
  if (code === 'ENOSPC') return 'The disk is full. Free space, then retry; inspect recovery before removing staged files.';
  if (['EACCES', 'EPERM', 'EROFS'].includes(code ?? '')) return 'The destination cannot be written. Choose a writable local folder and retry.';
  if (code === 'ENOENT') return 'A required file or tool is missing. Check Settings and the expected file path.';
  if ((error as Error)?.name === 'AbortError') return 'Operation cancelled. Your draft is kept.';
  return 'The operation failed. Check the library and tool paths, then retry. Existing records have been preserved.';
}
