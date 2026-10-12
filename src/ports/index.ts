import type { Catalogue, Metadata } from '../domain/model.js';

export interface DownloadRequest {
  sourceUrl: string;
  formatId: string;
  stagingDirectory: string;
}

export interface StagedFile {
  absolutePath: string;
  extension: string;
}

/** Real adapters must stop child processes and reject on abort. */
export interface DownloadAdapter {
  inspect(sourceUrl: string, signal: AbortSignal): Promise<Metadata>;
  download(request: DownloadRequest, signal: AbortSignal,
    onProgress: (percent: number) => void): Promise<StagedFile>;
}

/** revision is compared under an exclusive writer lock. */
export interface CatalogueRepository {
  load(): Promise<Catalogue>;
  save(catalogue: Catalogue, expectedRevision: number): Promise<void>;
}

export interface VerifiedFile {
  bytes: number;
  sha256: string;
}

/** Never overwrite an existing destination; enforce containment on resolved paths. */
export interface FileService {
  verify(staged: StagedFile, signal: AbortSignal): Promise<VerifiedFile>;
  promote(staged: StagedFile, relativePath: string): Promise<string>;
  discard(staged: StagedFile): Promise<void>;
}
