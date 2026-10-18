# Build the complete single-reference save path

Completed on 18 October 2026. Real single-item video/audio save is implemented with the injected yt-dlp adapter, checked tool versions, staging, final verification and locked catalogue commit. Real process cancellation, failed replacement and forced-crash recovery are covered by the Windows checks.

Release: https://github.com/JustinReyes28/sourcespool/releases/tag/v0.1.0

Source commit: 6085ac9e195baa5aaaa4f1e2158d9d1f9b0c9b76. Windows CI: https://github.com/JustinReyes28/sourcespool/actions/runs/39102078735

Evidence: docs/validation-phase-3-4.md, docs/verification-phase-3-4.json and docs/terminal-verification.json.

## Original acceptance plan

Phase 3 milestone 1. Depends on the phase 2 design scaffold and architecture contract.

Implement an injected yt-dlp adapter with startup yt-dlp/ffmpeg checks and pinned tested versions; inspect one permitted URL; choose an available format and destination; download to a unique staging directory; verify the completed media; promote without overwrite; commit a versioned local JSON catalogue with lock/revision/journal recovery. Replace fixture-only progress and completion for the real path. Keep the demo available as a separate mode.

Acceptance:

- A known permitted sample saves successfully and is immediately discoverable from Library.
- Record completion only after a regular nonempty final file is observed and size/hash verified.
- Invalid URLs, unavailable formats and dependency failures offer a concrete next action.
- No shell interpolation, silent tool downloads, playlists or credential/cookie handling.
- Integration tests exercise process cancellation, disk/commit failures and interrupted-save recovery on Windows.

References: docs/product-brief.md; docs/architecture.md; US-01, US-02, US-07. This issue describes work still to implement, not a working downloader in the scaffold.
