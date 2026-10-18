# Add collection context, search and portable catalogue import/export

Completed on 18 October 2026. Collections, tags/notes, offline context search, details, Windows open actions and metadata export/import are implemented. The real three-item/two-collection task, note retrieval, fresh import and missing-file behavior passed.

Release: https://github.com/JustinReyes28/sourcespool/releases/tag/v0.1.0

Source commit: 6085ac9e195baa5aaaa4f1e2158d9d1f9b0c9b76. Windows CI: https://github.com/JustinReyes28/sourcespool/actions/runs/39102078735

Evidence: docs/validation-phase-3-4.md, docs/verification-phase-3-4.json and docs/terminal-verification.json.

## Original acceptance plan

Phase 3 milestone 2. Depends on milestone 1's verified save/catalogue path.

Implement named collections, tags/notes, metadata search and item details; open file/source through Windows adapters; export and import the versioned metadata format with validation, preview and id-conflict choices. Preserve reference metadata when media has moved or is missing. Export contains metadata only; restoring it does not restore media.

Acceptance:

- Save three permitted samples into two collections and find one by its note.
- Tags, notes and original source survive a fresh catalogue export/import round trip.
- Incompatible versions, corrupt data and escaping paths are rejected without changing existing data.
- Missing files are clearly identified; source history remains available.
- File/source-open failure leaves details usable and does not execute arbitrary schemes.

References: docs/user-stories.md US-02, US-03, US-06, US-08; docs/architecture.md. Existing fixture search only demonstrates the interaction design.
