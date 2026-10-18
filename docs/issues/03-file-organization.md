# Implement validated naming templates and deliberate duplicate choices

Completed on 18 October 2026. Preview and final save share the naming service. Source/format preflight and completed-file hash choices are implemented; keep-existing/add-another, collisions, path validation, junction rejection and persistent templates are qualified.

Release: https://github.com/JustinReyes28/sourcespool/releases/tag/v0.1.0

Source commit: 6085ac9e195baa5aaaa4f1e2158d9d1f9b0c9b76. Windows CI: https://github.com/JustinReyes28/sourcespool/actions/runs/39102078735

Evidence: docs/validation-phase-3-4.md, docs/verification-phase-3-4.json and docs/terminal-verification.json.

## Original acceptance plan

Phase 3 milestone 3. Depends on milestones 1 and 2.

Implement a single naming service for preview and final paths, reusable per-collection templates, exact source/format duplicate preflight and completed-file SHA-256 duplicate detection across the library. Existing source warnings and final byte matches are separate checks. Keep-existing opens the existing item without silently merging the new note; save-another reserves a unique destination. Add missing/moved-file status and manual restoration guidance without metadata loss. Interactive relink by verified hash remains P1.

Acceptance:

- A repeated sample prompts and never silently overwrites the original.
- Keep-existing leaves media/record counts unchanged; save-another has a unique id/path.
- Windows reserved names, illegal characters, traversal, absolute paths, unsupported tokens, excessive lengths and symlink/reparse escapes have tested outcomes.
- Concurrent allocation and same-name collisions cannot replace an existing file.
- Template settings persist only after validation; preview matches the observed saved path.

References: docs/user-stories.md US-04, US-05; docs/workflow.md; docs/architecture.md. Fixture filename preview is not filesystem safety evidence.
