import type { DesignState, Draft, Item, Stage } from '../domain/model.js';
import { collections, fixtureItem, fixtureItems, fixtureMetadata } from '../adapters/fixtures.js';

export const stages: Stage[] = ['home', 'url', 'loading', 'format', 'organize', 'review',
  'progress', 'duplicate', 'completed', 'failure', 'cancelled', 'library', 'details', 'settings'];

export function initialState(items: Item[] = fixtureItems): DesignState {
  return {
    stage: 'home', draft: { sourceUrl: fixtureMetadata.sourceUrl, formatId: 'video-720',
      collectionId: 'field-notes', tags: 'rain, texture', notes: 'Look at the reflections.' },
    metadata: null, items: structuredClone(items), progress: 0, failureReason: '',
    search: '', template: '{collection}/{date}-{title}-{id}.{ext}', selectedItemId: null,
    keepAnother: false
  };
}

export type Event = { type: 'go'; stage: 'home' | 'url' | 'library' | 'settings' }
  | { type: 'edit'; field: keyof Draft; value: string }
  | { type: 'next' } | { type: 'back' } | { type: 'cancel' } | { type: 'retry' }
  | { type: 'progress'; percent: number } | { type: 'failure'; reason: string }
  | { type: 'duplicate'; choice: 'existing' | 'another' }
  | { type: 'search'; value: string } | { type: 'template'; value: string }
  | { type: 'details'; id: string };

export function validateSourceUrl(value: string): boolean {
  if (value.length > 4096 || /[\x00-\x1f\x7f]/.test(value)) return false;
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password; }
  catch { return false; }
}

export function searchItems(items: Item[], query: string): Item[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(item => terms.every(term =>
    [item.title, item.sourceUrl, item.notes, ...item.tags].join(' ').toLocaleLowerCase().includes(term)));
}

function completeSimulation(state: DesignState): DesignState {
  const item: Item = {
    ...fixtureItem,
    id: `demo-save-${state.items.length + 1}`,
    sourceUrl: state.draft.sourceUrl,
    sourceIdentity: { extractor: 'fixture', sourceId: fixtureMetadata.sourceId, formatId: state.draft.formatId },
    collectionId: state.draft.collectionId,
    tags: [...new Set(state.draft.tags.split(',').map(tag => tag.trim()).filter(Boolean))],
    notes: state.draft.notes
  };
  item.relativePath = previewPath(state, item.id);
  return { ...state, stage: 'completed', progress: 100, items: [...state.items, item], selectedItemId: item.id };
}

/** An original design simulator. Completion represents a fixture, never a real file. */
export function transition(state: DesignState, event: Event): DesignState {
  switch (event.type) {
    case 'go': return { ...state, stage: event.stage, failureReason: '', keepAnother: false, progress: 0 };
    case 'edit': return { ...state, draft: { ...state.draft, [event.field]: event.value } };
    case 'search': return { ...state, search: event.value };
    case 'template': return { ...state, template: event.value };
    case 'details': return state.items.some(item => item.id === event.id)
      ? { ...state, stage: 'details', selectedItemId: event.id } : state;
    case 'failure': return ['loading', 'progress'].includes(state.stage)
      ? { ...state, stage: 'failure', failureReason: event.reason } : state;
    case 'cancel': return { ...state, stage: 'cancelled', progress: 0 };
    case 'retry': return { ...state, stage: 'url', progress: 0, failureReason: '' };
    case 'progress': return state.stage === 'progress'
      ? { ...state, progress: Math.max(0, Math.min(99, event.percent)) } : state;
    case 'duplicate':
      if (state.stage !== 'duplicate') return state;
      if (event.choice === 'existing') {
        const existing = state.items.find(item => item.hash === fixtureItem.hash);
        return { ...state, stage: 'details', selectedItemId: existing?.id ?? null };
      }
      return completeSimulation({ ...state, keepAnother: true });
    case 'back': {
      const previous: Partial<Record<Stage, Stage>> = {
        url: 'home', loading: 'url', format: 'url', organize: 'format', review: 'organize',
        library: 'home', details: 'library', settings: 'home', completed: 'home',
        failure: 'url', cancelled: 'url'
      };
      return previous[state.stage] ? { ...state, stage: previous[state.stage]! } : state;
    }
    case 'next':
      switch (state.stage) {
        case 'url': return validateSourceUrl(state.draft.sourceUrl)
          ? { ...state, stage: 'loading', failureReason: '' }
          : { ...state, failureReason: 'Enter an http or https URL without a username or password.' };
        case 'loading': return { ...state, stage: 'format', metadata: fixtureMetadata };
        case 'format': return { ...state, stage: 'organize' };
        case 'organize': return { ...state, stage: 'review' };
        case 'review': return { ...state, stage: 'progress', progress: 0 };
        case 'progress': return state.items.some(item => item.hash === fixtureItem.hash)
          ? { ...state, stage: 'duplicate', progress: 99 } : completeSimulation(state);
        case 'completed': return { ...state, stage: 'library' };
        default: return state;
      }
  }
}

/** Preview only. Phase 3 must validate templates, containment, length, reserved names and collisions. */
export function previewPath(state: DesignState, id = 'demo-save-003'): string {
  const collection = collections.find(entry => entry.id === state.draft.collectionId);
  const format = fixtureMetadata.formats.find(entry => entry.id === state.draft.formatId);
  const values: Record<string, string> = { collection: collection?.id ?? 'field-notes',
    date: '2026-10-12', title: 'rain-on-the-studio-window', id, ext: format?.extension ?? 'mp4' };
  return state.template.replace(/\{(\w+)\}/g, (token, key: string) => values[key] ?? token);
}

export function scenario(stage: Stage, empty = false): DesignState {
  const state = initialState(empty ? [] : fixtureItems);
  state.stage = stage;
  state.metadata = fixtureMetadata;
  state.progress = stage === 'completed' ? 100 : 42;
  state.failureReason = stage === 'failure' ? 'The source could not be read. Check the URL, then retry.' : '';
  state.selectedItemId = fixtureItem.id;
  if (stage === 'completed') return completeSimulation(state);
  return state;
}
