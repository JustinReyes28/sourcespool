# Finish Windows recovery, keyboard usability and measured performance

Completed on 18 October 2026. Recovery, actionable failures, full field cursor editing, list selection, compact/short terminals and paged long content are implemented. Real Windows Terminal mode cleanup, process-tree cancellation and forced-writer recovery passed. Performance and full tool footprint are recorded. The owner explicitly approved documented solo validation and deferring the three-to-five-person study; interviews and independent beta observations remain unperformed, with product assumptions unvalidated.

Release: https://github.com/JustinReyes28/sourcespool/releases/tag/v0.1.0

Source commit: 6085ac9e195baa5aaaa4f1e2158d9d1f9b0c9b76. Windows CI: https://github.com/JustinReyes28/sourcespool/actions/runs/39102078735

Evidence: docs/validation-phase-3-4.md, docs/verification-phase-3-4.json and docs/terminal-verification.json.

## Original acceptance plan

Phase 3 milestone 4. Depends on all three preceding milestones.

Map real downloader errors into actionable categories; preserve draft/back/cancel behavior; support full field cursor editing and list selection; handle narrow and short terminals; provide consistent help. Test actual Windows Terminal cursor/raw-mode cleanup, process-tree cancellation and interrupted JSON replacement/recovery. Validate light and dark terminals and assistive reading before claiming accessibility. Complete the pending three-to-five-user problem study and use observations to revise positioning.

Acceptance:

- Cancellation/failure never creates a completed entry pointing at unfinished media.
- Ctrl+C, normal exit and thrown errors restore the real terminal; child processes terminate.
- Recovery never duplicates a committed journal entry or overwrites a previous valid catalogue.
- Cancellation before promotion adds no record; cancellation/exit during the non-interruptible commit section waits for and reports the actual Saved or Recovery required outcome.
- No-results/empty/missing-file states and format/network/disk/dependency errors all have a next action.
- Measure interactive startup, real catalogue search/write costs and full external-tool footprint on a named Windows test machine; compare with provisional targets.
- The end-to-end three-item beta task and the three promised differences work together before phase 4 release validation.

References: docs/workflow.md; docs/architecture.md; docs/baseline.json; docs/research/problem-validation.md. Controlled-stream tests in phase 2 do not prove real-terminal restoration.
