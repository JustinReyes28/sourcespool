# Architecture and storage contract

Implementation update, 18 October 2026: the production coordinator, downloader, Windows opener, settings and locked JSON/file adapters are implemented. This document retains the original phase 2 design record; current behavior and qualification evidence are in validation-phase-3-4.md and the README.

Architecture defined 12 October 2026; production implementation qualified 18 October 2026. The separate phase 2 simulator is retained for historical sketches.

## Boundaries

`src/ui` renders screens and maps keys to events. `src/application` currently contains the design simulator; phase 3 adds a save-reference coordinator. `src/domain` contains product data and later pure validation/search/naming rules. `src/ports` describes external effects. `src/adapters` currently contains original fixtures; phase 3 adds yt-dlp, filesystem and JSON implementations. UI and domain must not spawn processes or perform filesystem writes.

```text
React/Ink views → application coordinator → domain rules
                         │
                ports (download / files / catalogue)
                         │
            yt-dlp process / Windows filesystem / JSON
```

The prototype intentionally imports fixtures in the design simulator. Production coordination must receive adapters through dependency injection and cannot call simulated completion. Production adapters are implemented in local-library.ts, downloader.ts, settings.ts and opener.ts. File verification/promotion and catalogue replacement share one LocalLibrary transaction boundary so their lock/journal ordering stays together. The earlier FileService/CatalogueRepository ports remain design references; the production coordinator injects LocalLibrary plus DownloadAdapter. [Type contracts](../src/ports/index.ts), [data types](../src/domain/model.ts).

## Runtime and dependencies

Runtime support: Windows 11 x64, PowerShell/Windows Terminal, local NTFS storage and **Node 22 or newer**. Ink and several terminal dependencies set the minimum at Node 22. Node 24.19.0 remains the pinned development runtime; the startup guard accepts newer Node majors. Windows CI checks Node 22.0.0, 24.19.0, 25.2.1 and the latest Node 26 release. Do not broaden operating-system claims from dependency portability alone.

React 19.3.0, Ink 8.0.0, TypeScript 7.0.2 and tsx 4.23.15 are pinned, with the lockfile recording transitive versions. The build uses tsc without a bundler. `private: true` prevents accidental npm publication while allowing the explicitly requested public GitHub repository. The production adapter checks executable paths/version output and reports missing tools. Tested versions are yt-dlp 2026.08.19 and FFmpeg 9.0.2 Essentials; see tool-provenance.md.

## Storage locations and ownership

Production defaults: configuration in `%LOCALAPPDATA%\SourceSpool\settings.json`; a user-selected library root (suggested `%USERPROFILE%\Videos\SourceSpool`) containing `catalogue.json`, `catalogue.json.bak`, `.staging/`, `.transactions/` and media under collection folders. The user confirms a writable local root before a first save. An explicit `--library <path>` override supports portable backup. No production file is written by the phase 2 demo; session data is memory only.

The catalogue contains only portable forward-slash paths relative to that root. Settings store the root and UI preferences separately. Do not include credentials, authentication cookies, full child-process output, absolute machine paths or user drafts in exports. Item source URLs may be private; exports are user-controlled and not uploaded by the app.

## Version 1 model

Catalogue envelope: `schemaVersion: 1`, monotonic integer `revision`, `collections[]`, `items[]`. Item: stable id, validated sourceUrl, title, UTC ISO createdAt, relativePath, positive integer verified bytes, lowercase SHA-256 hash, unique tags, notes, collectionId. Completed and imported historical items must have positive recorded bytes even when the file is currently missing. Collection: id, name, namingTemplate. Job: id, stage, selectedFormat, progress (number or null when unknown), failureReason. Jobs/drafts are transient except minimal recovery journal entries.

The item also includes `sourceIdentity: { extractor, sourceId, formatId }` for an early source/format duplicate warning. The prototype uses fixture identity; production must obtain it from validated adapter metadata. Hash duplicates are checked across all collections after download. Exact bytes are different from perceptually similar content. No fuzzy duplicate claim.

Validate envelopes, types, id uniqueness, collection references, bounded text/array/file sizes, relative paths and format version before loading/importing. Unknown future versions fail with “Use a compatible SourceSpool version”; never reinterpret or downgrade them silently. Any later schema change gets an explicit migration with backup. Do not treat external JSON as executable configuration.

## Save transaction and recovery

1. Validate URL, chosen format, collection and naming template. Reject embedded credentials, control characters and non-http(s) schemes. Inspect/download through argument arrays and `shell: false`; never interpolate a URL into a shell command. Treat titles/process output as data and strip terminal control sequences before display.
2. Create a unique job staging directory. Download one item there with playlist processing disabled. Cancellation uses AbortSignal, stops the Windows child-process tree and waits for it to close before cleanup. Real tests must prove this behavior.
3. Verify that the staged file is regular, nonempty and complete; compute size/SHA-256 from observed bytes. Show a duplicate choice before promoting. Keep-existing removes only the current job's staged data and returns to the existing item. Save-another reserves a unique destination.
4. Validate the final path after resolving it under the root. Reject absolute paths, `..`, unsupported tokens, Windows reserved names and symlink/reparse escapes. Limit generated path length. Never overwrite; collision allocation must be atomic, not an exists-then-write race.
5. Acquire an exclusive catalogue writer lock and compare the loaded revision. Write and flush a recovery journal for this job, including the intended metadata and destination. Promote verified media without overwrite. Catalogue commit is permitted only after the final file is observed and verified.
6. Serialize the next catalogue to a unique temp file in the **same directory**, flush/close, retain the last valid backup, and replace the index with a tested atomic same-volume operation. Do not delete the live catalogue before replacement. Advance revision under the lock, then remove the journal and release the lock. Replacement errors must preserve the prior valid index.

A crash before promotion leaves staged media and no completed record. A crash after promotion but before catalogue replacement leaves a final file plus journal; offer “Recover verified item” or “Keep file unlisted”, checking path/hash again. A crash after replacement leaves a journal that recovery recognizes by committed id/revision; never add it twice. If a final file is missing, retain metadata and report missing status. Cleanup removes only verified job-owned paths inside the library; never broad recursive deletion of a computed root.

Cancellation is interruptible through inspection, downloading and staged-file hashing; the file verification port receives AbortSignal. Once the journal is durable and promotion begins, promotion/catalogue replacement is a short non-interruptible commit section. A cancel/exit request there waits for the section to settle; disable Back/Retry and show “Finishing save; cancellation requested.” Report **Saved** if the commit succeeds or **Recovery required** if it fails, then honor exit. Never label a committed item “cancelled” or promise that no record was added after crossing this boundary. A forced process kill is handled by journal recovery on the next launch. Tests must exercise both sides of this cancellation boundary.

Single-writer JSON with conflict detection is sufficient for the expected small library. Do not silently break a stale lock: check owner process/age and offer a recovery action. Concurrent save tests and Windows interruption tests are required before declaring persistence complete. Local NTFS only initially; network/cloud-sync folders are untested.

## Import/export behavior

Export writes a versioned metadata envelope (no media payload, no job data) to a user-chosen destination. Import first validates and previews added/conflicting records, then merges under the writer lock by stable id. Conflicts require an explicit choice; do not overwrite by title. Resolve every relative path against the current library root and report present/missing status from the filesystem. A successful metadata import does not imply media was downloaded/restored. Copy the media tree separately to reproduce a library.

## Naming and failure contracts

Allowed tokens: `{collection}`, `{date}`, `{title}`, `{id}`, `{ext}`. `{date}` derives from createdAt in UTC for stable exports; the UI labels this rule. Collection ids are sanitized stable slugs. Apply Windows filename normalization to token values, preserve template structure only after validation, and always include a uniqueness mechanism. Preview and final path use the same production naming service.

Typed failure categories: invalid input, missing dependency, unsupported source/format, network/auth requirement, unwritable destination, insufficient space, verification failure, catalogue conflict/corruption and cancelled operation. Give a specific next action, preserve the draft, and keep raw logs out of public output. Production mapping covers format/source availability, network/authentication, dependency and disk failures; the separate phase 2 simulator retains its synthetic failure state.

## Measurement and exit boundary

Measure cold-ish startup to a rendered snapshot, in-memory metadata search, and installed scaffold footprint on the named development host. See [baseline](baseline.json) and [verification](verification.md). Set provisional targets after observing those results. SQLite becomes an option if measured JSON updates or small-library searches miss targets repeatedly; no migration based on hypothetical scale.

Phase 2 is complete when the workflow is demonstrable, contracts/recovery decisions exist, checks pass and the reviewed scaffold is verified remotely. Downloading, filesystem safety, atomic writes and real terminal restoration remain production acceptance work, not claims inferred from this design.
