# Prioritized stories and release acceptance

Phase 1 decisions, 12 October 2026. P0 is required for the first release. P1 improves the same job after P0. All real-media features remain phase 3 work; the phase 2 prototype only exercises design states.

## P0 — complete first-release journey

- **US-01 Save a permitted reference.** As a creator, I can add one URL, select an available format and see my destination before saving. Accept when one known permitted sample becomes a nonempty, verified file and one catalogue item; invalid URLs, unsupported formats and failed tool checks explain the next action. Build milestone 1.
- **US-02 Keep reference context.** I can choose a collection and add tags and a note at save time. Accept when going back retains my draft, completed metadata includes the original source, and item details show all context. Build milestones 1/2.
- **US-03 Find the reason I saved it.** I can search titles, source URLs, tags and notes offline. Accept when searching “reflections” finds the sample by note; combined terms must all match and an empty result offers a clear recovery. Build milestone 2.
- **US-04 Control duplicates.** I can keep an existing item or intentionally save another. Accept when a repeat exact source/format prompts early and a repeat content hash prompts after verification; keep-existing leaves record/file counts unchanged; save-another creates a unique path; neither choice overwrites the first file. Build milestone 3.
- **US-05 Predict my folders.** I can save a collection template and see the generated filename. Accept when only supported tokens are accepted, Windows reserved names/characters and traversal are rejected or normalized by explicit policy, containment is checked after resolving paths, and collisions receive a unique suffix. Build milestone 3.
- **US-06 Back up and restore metadata.** I can export and import a versioned catalogue. Accept when a fresh import round-trips fields, rejects incompatible/corrupt data without overwriting the existing catalogue, and marks missing media files without deleting source history. Build milestone 2.
- **US-07 Stop or recover work.** I can request cancellation or exit from every work state and retry after a settled failure. Accept when child processes stop, partial artifacts stay out of the completed catalogue, my draft survives back/cancel during the session, the terminal is restored on exit, and an interrupted commit can be recovered. Cancellation during the short promotion/commit section waits for its actual saved/recovery outcome before honoring exit; do not report that no item was saved if the commit completed. Build milestone 4.
- **US-08 Reach the saved item.** I can open its file or source from details. Accept when missing files explain how to restore the file at its expected path, source opening is limited to validated http/https URLs, and platform launch failures keep the item visible. Interactive verified relinking is P1. Build milestone 2.

## P1 — after the core journey

- Edit a completed item's tags and notes under the same catalogue transaction rules.
- Relink a moved file after verifying its hash; metadata remains available meanwhile.
- A machine-readable, noninteractive save command with predictable exit codes.
- Search/sort beyond the initial small library only after measured latency warrants it.

## Deferred backlog

Playlists and subscriptions; login/cookies; transcript indexing; cloud sync; multi-user sharing; custom themes; macOS/Linux release claims; package registry publishing; automatic dependency downloads. Each requires a new scope decision rather than quietly entering the initial release.

## Assumptions to validate

Users want tags and notes before saving; exact-byte duplicates are useful despite different encodings; a local JSON file is easier to back up; a terminal is acceptable for this audience; naming templates deserve a user-facing setting. No interview evidence has yet confirmed these assumptions.
