import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, previewPath, searchItems, transition, validateSourceUrl } from '../src/application/design-simulator.js';
import { fixtureItems } from '../src/adapters/fixtures.js';
import type { DesignState } from '../src/domain/model.js';

function reachProgress(items = fixtureItems): DesignState {
  let state = transition(initialState(items), { type: 'go', stage: 'url' });
  for (let step = 0; step < 5; step++) state = transition(state, { type: 'next' });
  assert.equal(state.stage, 'progress');
  return state;
}

test('a new reference reaches the library and is searchable by its saved note', () => {
  let state = reachProgress([]);
  assert.equal(state.items.length, 0, 'unfinished saves must not appear completed');
  state = transition(state, { type: 'next' });
  assert.equal(state.stage, 'completed');
  assert.equal(state.items.length, 1);
  state = transition(state, { type: 'next' });
  assert.equal(state.stage, 'library');
  assert.equal(searchItems(state.items, 'reflections')[0]?.id, state.selectedItemId);
});

test('back and cancellation keep the source, collection, tags and notes', () => {
  let state = transition(initialState([]), { type: 'go', stage: 'url' });
  state = transition(state, { type: 'edit', field: 'notes', value: 'Distinctive reflection to compare.' });
  const draft = structuredClone(state.draft);
  for (let step = 0; step < 4; step++) state = transition(state, { type: 'next' });
  state = transition(state, { type: 'back' });
  assert.equal(state.stage, 'organize');
  assert.deepEqual(state.draft, draft);
  state = transition(state, { type: 'cancel' });
  assert.equal(state.items.length, 0);
  state = transition(state, { type: 'retry' });
  assert.equal(state.stage, 'url');
  assert.deepEqual(state.draft, draft);
});

test('failure while saving cannot add a completed record and retry keeps context', () => {
  let state = reachProgress([]);
  const draft = structuredClone(state.draft);
  state = transition(state, { type: 'failure', reason: 'Simulated disk is full.' });
  assert.equal(state.stage, 'failure');
  assert.equal(state.items.length, 0);
  state = transition(state, { type: 'retry' });
  assert.deepEqual(state.draft, draft);
  assert.equal(state.progress, 0);
});

test('duplicate keep-existing returns its details without adding a record', () => {
  let state = transition(reachProgress(), { type: 'next' });
  assert.equal(state.stage, 'duplicate');
  state = transition(state, { type: 'duplicate', choice: 'existing' });
  assert.equal(state.stage, 'details');
  assert.deepEqual(state.items, fixtureItems);
  assert.equal(state.selectedItemId, fixtureItems[0]?.id);
});

test('duplicate save-another uses a distinct id and path while preserving the original', () => {
  let state = transition(reachProgress(), { type: 'next' });
  state = transition(state, { type: 'duplicate', choice: 'another' });
  assert.equal(state.stage, 'completed');
  assert.equal(state.items.length, 3);
  assert.deepEqual(state.items[0], fixtureItems[0]);
  assert.equal(new Set(state.items.map(item => item.id)).size, 3);
  assert.equal(new Set(state.items.map(item => item.relativePath)).size, 3);
});

test('stale completion or duplicate events after cancellation cannot add a record', () => {
  let state = transition(reachProgress([]), { type: 'cancel' });
  state = transition(state, { type: 'next' });
  state = transition(state, { type: 'duplicate', choice: 'another' });
  state = transition(state, { type: 'progress', percent: 99 });
  assert.equal(state.stage, 'cancelled');
  assert.equal(state.items.length, 0);
});

test('an invalid URL remains editable; credential and executable schemes are rejected', () => {
  for (const source of ['not a URL', 'file:///C:/media.mp4', 'javascript:alert(1)', 'https://user:password@example.com', 'https://exam\nple.com']) {
    assert.equal(validateSourceUrl(source), false);
    const state = transition({ ...initialState([]), stage: 'url', draft: { ...initialState().draft, sourceUrl: source } }, { type: 'next' });
    assert.equal(state.stage, 'url');
    assert.ok(state.failureReason.length);
    assert.equal(state.items.length, 0);
  }
  assert.equal(validateSourceUrl('https://example.com/reference?query=rain'), true);
});

test('search combines terms across context fields and leaves the collection intact', () => {
  assert.equal(searchItems(fixtureItems, 'RAIN reflections').length, 1);
  assert.equal(searchItems(fixtureItems, 'example.com portrait')[0]?.title, 'Desk lamp light study');
  assert.equal(searchItems(fixtureItems, 'no-match').length, 0);
  assert.equal(fixtureItems.length, 2);
});

test('format and collection choices are reflected in the simulated destination', () => {
  let state = initialState();
  state = transition(state, { type: 'edit', field: 'formatId', value: 'audio' });
  state = transition(state, { type: 'edit', field: 'collectionId', value: 'studio' });
  assert.equal(previewPath(state, 'chosen-id'), 'studio/2026-10-12-rain-on-the-studio-window-chosen-id.m4a');
});
