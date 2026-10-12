export interface Collection {
  id: string;
  name: string;
  namingTemplate: string;
}

export interface Item {
  id: string;
  sourceUrl: string;
  title: string;
  sourceIdentity: { extractor: string; sourceId: string; formatId: string };
  createdAt: string;
  relativePath: string;
  bytes: number;
  hash: string;
  tags: string[];
  notes: string;
  collectionId: string;
}

export interface Catalogue {
  schemaVersion: 1;
  revision: number;
  collections: Collection[];
  items: Item[];
}

export interface MediaFormat {
  id: string;
  label: string;
  extension: string;
}

export interface Metadata {
  sourceUrl: string;
  extractor: string;
  sourceId: string;
  title: string;
  formats: MediaFormat[];
}

export type Stage = 'home' | 'url' | 'loading' | 'format' | 'organize' | 'review'
  | 'progress' | 'duplicate' | 'completed' | 'failure' | 'cancelled' | 'library'
  | 'details' | 'settings';

export interface Draft {
  sourceUrl: string;
  formatId: string;
  collectionId: string;
  tags: string;
  notes: string;
}

export interface DesignState {
  stage: Stage;
  draft: Draft;
  metadata: Metadata | null;
  items: Item[];
  progress: number;
  failureReason: string;
  search: string;
  template: string;
  selectedItemId: string | null;
  keepAnother: boolean;
}

export interface Job {
  id: string;
  stage: 'inspecting' | 'downloading' | 'verifying' | 'duplicate' | 'committing' | 'completed' | 'failed' | 'cancelled';
  selectedFormat: string;
  progress: number | null;
  failureReason: string | null;
}
