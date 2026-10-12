import type { Collection, Item, Metadata } from '../domain/model.js';

// All examples are original synthetic content, not downloaded media.
export const collections: Collection[] = [
  { id: 'field-notes', name: 'Field notes', namingTemplate: '{collection}/{date}-{title}-{id}.{ext}' },
  { id: 'studio', name: 'Studio references', namingTemplate: '{collection}/{date}-{title}-{id}.{ext}' }
];

export const fixtureMetadata: Metadata = {
  sourceUrl: 'https://example.com/original-rain-study',
  extractor: 'fixture',
  sourceId: 'rain-study',
  title: 'Rain on the studio window',
  formats: [
    { id: 'video-720', label: 'Video · 720p · MP4', extension: 'mp4' },
    { id: 'audio', label: 'Audio · M4A', extension: 'm4a' }
  ]
};

export const fixtureItem: Item = {
  id: 'demo-rain-001',
  sourceUrl: fixtureMetadata.sourceUrl,
  title: fixtureMetadata.title,
  sourceIdentity: { extractor: 'fixture', sourceId: fixtureMetadata.sourceId, formatId: 'video-720' },
  createdAt: '2026-10-12T10:00:00.000Z',
  relativePath: 'field-notes/2026-10-12-rain-on-the-studio-window-demo-rain-001.mp4',
  bytes: 128000,
  hash: 'a'.repeat(64),
  tags: ['rain', 'texture'],
  notes: 'Own recording concept. Look at the changing reflections.',
  collectionId: 'field-notes'
};

export const fixtureItems: Item[] = [fixtureItem, {
  ...fixtureItem,
  id: 'demo-light-002',
  sourceUrl: 'https://example.com/original-lamp-study',
  title: 'Desk lamp light study',
  sourceIdentity: { extractor: 'fixture', sourceId: 'lamp-study', formatId: 'video-720' },
  relativePath: 'studio/2026-10-12-desk-lamp-light-study-demo-light-002.mp4',
  hash: 'b'.repeat(64),
  tags: ['lighting'],
  notes: 'Own recording concept. Side light for a portrait sketch.',
  collectionId: 'studio'
}];
