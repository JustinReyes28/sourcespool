# Phase 1/2 verification

Date: 12 October 2026 · supported scaffold runtime: Node 24.19.0 on Windows x64.

## Local checks

- `npm run check` passes: strict typechecking of application/scripts/tests, 12 behavioral and controlled-stream keyboard tests, CLI compilation and deterministic generation of 16 workflow sketches.
- The tests cover a complete empty-library fixture journey, note-based retrieval, draft retention on back/cancel/failure, both duplicate choices, stale completion events after cancellation, invalid/credential/control-character URLs, combined metadata search, format/collection preview, help, collection keyboard shortcut, resize to 40 columns and controlled raw-input cleanup on exit.
- `npm install` audited 51 packages and reported zero known vulnerabilities at installation time. This is a dated package audit, not a product-security claim. Dependency licenses and direct versions were checked against installed metadata.
- Browser review checks the original gallery, duplicate/failure/empty states, theme switching, small-screen wrapping and keyboard-focus indication. It verifies the review artifact only, not the real terminal's assistive behavior.
- A fresh-reader documentation review checked audience, release boundary, current implementation, cancellation, persistence/recovery, import and provenance. Resolved findings: specify the non-interruptible commit boundary; supply extractor identity through the inspect contract; require positive completed-file bytes; distinguish P0 manual restoration guidance from P1 verified relinking.

## Baseline and provisional targets

Evidence: [raw measurement](baseline.json). Host label: SourceSpool development host, Windows x64, OS release 10.0.26200, Intel i7-1165G7, 15.7 GiB memory, Node 24.19.0.

Seven fresh-process fixture-home snapshot runs: median **620.126 ms**, maximum **944.900 ms**. This is process-to-printed-snapshot timing, not interactive first paint. One hundred in-memory searches over 1,000 repeated synthetic records: median **0.852 ms**, p95 **1.255 ms**. It excludes disk, UI rendering and realistic corpus variety.

Installed development dependencies: **55,620,178 bytes** across 5,688 files (about 53.0 MiB). Compiled scaffold at measurement: **48,556 bytes**. The build can change with subsequent contract-only edits; the recorded measurement remains the dated baseline. These numbers exclude Node itself, npm cache, yt-dlp, ffmpeg and saved media. They are not an end-user installation-size claim.

After observing this baseline, set provisional targets: snapshot-startup median under 1,500 ms, 1,000-item search p95 under 50 ms, scaffold dependencies under 100 MiB. Re-measure real catalogue reads/writes, interactive rendering and full external-tool footprint during phase 3. Reconsider storage only with measured evidence.

## Remaining validation boundaries

No permitted media was downloaded. No real downloader, filesystem verification/hash, safe promotion, atomic JSON writer, import/export, settings persistence or operating-system open action is implemented. No actual Windows Terminal restoration or network-source reliability claim is made. User interviews remain pending by the phase 1 gate's explicit allowance. Production and beta checks belong to phase 3/4.

The GitHub upload, commit comparison, issue URLs and Actions result are recorded separately in [execution status](execution-status.md).
