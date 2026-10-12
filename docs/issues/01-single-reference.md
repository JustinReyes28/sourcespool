# Build the complete single-reference save path

Phase 3 milestone 1. Depends on the phase 2 design scaffold and architecture contract.

Implement an injected yt-dlp adapter with startup yt-dlp/ffmpeg checks and pinned tested versions; inspect one permitted URL; choose an available format and destination; download to a unique staging directory; verify the completed media; promote without overwrite; commit a versioned local JSON catalogue with lock/revision/journal recovery. Replace fixture-only progress and completion for the real path. Keep the demo available as a separate mode.

Acceptance:

- A known permitted sample saves successfully and is immediately discoverable from Library.
- Record completion only after a regular nonempty final file is observed and size/hash verified.
- Invalid URLs, unavailable formats and dependency failures offer a concrete next action.
- No shell interpolation, silent tool downloads, playlists or credential/cookie handling.
- Integration tests exercise process cancellation, disk/commit failures and interrupted-save recovery on Windows.

References: docs/product-brief.md; docs/architecture.md; US-01, US-02, US-07. This issue describes work still to implement, not a working downloader in the scaffold.
