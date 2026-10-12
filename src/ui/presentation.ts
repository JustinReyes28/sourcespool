import { collections } from '../adapters/fixtures.js';
import { previewPath, searchItems } from '../application/design-simulator.js';
import type { DesignState } from '../domain/model.js';

export interface Screen { title: string; lines: string[]; help: string; }

export function screenFor(state: DesignState): Screen {
  const draft = state.draft;
  const selected = state.items.find(item => item.id === state.selectedItemId);
  const common = 'Esc Back · Ctrl+C Exit · Ctrl+G Help';
  switch (state.stage) {
    case 'home': return { title: 'Your references', lines: [
      `${state.items.length} saved examples · ${collections.length} collections`, '',
      ...collections.map(collection => {
        const count = state.items.filter(item => item.collectionId === collection.id).length;
        return `${collection.name}   ${count} ${count === 1 ? 'item' : 'items'}`;
      }), '',
      state.items.length ? `Recent: ${state.items.at(-1)?.title}` : 'Start a collection with your first reference.',
      '', '[a] Add a reference', '[l] Search library', '[s] Naming settings'], help: 'A Add · L Library · S Settings · Ctrl+C Exit · Ctrl+G Help' };
    case 'url': return { title: 'Add a reference · Source', lines: [
      'Source URL', draft.sourceUrl || '(enter a URL)', '',
      'Only save media you are permitted to keep.',
      state.failureReason, '', 'This prototype reads a local fixture for every valid URL.'
    ].filter(line => line !== undefined), help: `Enter Read source · ${common}` };
    case 'loading': return { title: 'Reading source', lines: [draft.sourceUrl, '',
      'Finding available formats…', 'Your tags and notes stay in the draft.'], help: `Enter Simulate response · X Cancel · F Simulate failure · ${common}` };
    case 'format': return { title: 'Add a reference · Format', lines: [state.metadata?.title ?? '', '',
      '[1] Video · 720p · MP4', '[2] Audio · M4A', '', `Selected: ${draft.formatId}`], help: `1/2 Select · Enter Continue · ${common}` };
    case 'organize': return { title: 'Add a reference · Organize', lines: [
      `Collection: ${collections.find(collection => collection.id === draft.collectionId)?.name}`, '',
      `Tags: ${draft.tags}`, `Notes: ${draft.notes}`, '', 'File preview:', previewPath(state)
    ], help: `Tab Next field · Ctrl+K Switch collection · Enter Review · ${common}` };
    case 'review': return { title: 'Ready to save', lines: [state.metadata?.title ?? '',
      draft.sourceUrl, '', `Format: ${draft.formatId}`, `Tags: ${draft.tags}`, `Notes: ${draft.notes}`, '',
      `Destination: ${previewPath(state)}`, '', 'A matching file will require your choice.'], help: `Enter Simulate save · ${common}` };
    case 'progress': return { title: 'Saving reference', lines: [state.metadata?.title ?? '', '',
      `Progress: ${state.progress}%`, '', 'The catalogue changes after file verification.',
      'Simulation only: no file or catalogue is being written.'], help: `Enter Simulate verification · X Cancel · F Simulate failure · ${common}` };
    case 'duplicate': return { title: 'This reference is already saved', lines: [
      'The completed-file hash matches an existing reference.', fixtureItemTitle(state), '',
      '[k] Keep existing — open its details', '[n] Save another — use a new filename', '',
      'Existing files are never overwritten.'], help: `K Keep existing · N Save another · X Cancel · ${common}` };
    case 'completed': return { title: 'Reference saved · Simulated', lines: [selected?.title ?? '', '',
      selected?.relativePath ?? '', '', 'Source, tags and notes are now searchable in this session.',
      'No actual media file was created.'], help: `Enter Search library · ${common}` };
    case 'failure': return { title: 'Could not save this reference', lines: [state.failureReason, '',
      'Check the URL and connection, then retry.', 'No completed record was added. Your draft is kept.'], help: `R Retry · X Cancel · ${common}` };
    case 'cancelled': return { title: 'Save cancelled', lines: ['No completed record was added.',
      'Your source, format, tags and notes are kept for this session.'], help: `R Return to draft · H Home · ${common}` };
    case 'library': {
      const results = searchItems(state.items, state.search);
      return { title: 'Search library', lines: [`Search: ${state.search || '(type a title, tag, note or source)'}`, '',
        ...results.map((item, index) => `[${index + 1}] ${item.title}  #${item.tags.join(' #')}`),
        results.length ? '' : 'No matches. Clear the search or try a different word.'], help: `Enter Open first result · Ctrl+U Clear · ${common}` };
    }
    case 'details': return { title: 'Reference details', lines: selected ? [selected.title,
      `Source: ${selected.sourceUrl}`, `File: ${selected.relativePath}`, `Tags: ${selected.tags.join(', ')}`,
      `Notes: ${selected.notes}`, '', '[o] Open file — planned for phase 3', '[u] Open source — planned for phase 3',
      '[e] Export collection — planned for phase 3'] : ['No reference selected. Return to the library.'], help: common };
    case 'settings': return { title: 'Naming settings', lines: ['Naming template', state.template, '',
      'Preview', previewPath(state), '', 'Tokens: {collection} {date} {title} {id} {ext}',
      'Preview only; validated settings persistence is planned for phase 3.'], help: `Type Edit template · Ctrl+U Clear · ${common}` };
  }
}

function fixtureItemTitle(state: DesignState): string {
  return state.items.find(item => item.hash === 'a'.repeat(64))?.title ?? 'Rain on the studio window';
}

export function plainScreen(state: DesignState): string {
  const screen = screenFor(state);
  return ['SourceSpool / design prototype / local fixtures', '', screen.title, '-'.repeat(54),
    ...screen.lines, '', '-'.repeat(54), screen.help].join('\n');
}
