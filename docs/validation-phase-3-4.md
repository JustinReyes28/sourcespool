# Phase 3 and 4 validation

Validation date: 18 October 2026, Asia/Singapore. Supported environment: Windows 11 x64, local NTFS, Node 24.19.0, yt-dlp 2026.08.19 and Gyan FFmpeg 9.0.2 Essentials.

## Owner-approved release gate

The original plans proposed a three-to-five-person problem study and a beta task completed independently by at least three testers. For this execution, the owner explicitly chose **documented solo testing** and separately approved **deferring interviews, with the limitation documented**.

No interviews, independent tester observations or usability success rates are claimed. The audience/problem, value of notes before saving, usefulness of exact-byte duplicate checks, terminal acceptance and preferred naming rules remain unvalidated product assumptions. The research protocol remains in [problem validation](research/problem-validation.md). The approved release gate is functional qualification on the supported Windows environment, honest limitations, a reproducible source package and a verified public GitHub release. Human research is deferred follow-up, rather than fabricated release evidence.

## Implemented first-release scope

- US-01/02: real single-item video/audio inspection and download, format selection, collection choice, tags, notes and a destination preview; completion follows final file/hash verification.
- US-03: offline search across title, source URL, tags and notes, including combined terms and no-results recovery.
- US-04/05: exact source/format preflight; completed-file SHA-256 choice; keep-existing/add-another behavior; persistent collection templates; Windows-safe naming, containment, length checks and atomic no-overwrite allocation.
- US-06: bounded versioned JSON export/import, preview, explicit conflict choice and missing-file status. Metadata import does not restore media.
- US-07: real child-process cancellation, draft retention, locked JSON replacement/backup, recovery journals, stale-lock inspection, and truthful cancellation during commit.
- US-08: Windows file/source opening from details; executable extensions and arbitrary URL schemes are refused. Media hashes are rechecked before opening.

The application controller and coordinator inject the real downloader and local-library adapters. The original simulator remains under the explicit demo/snapshot modes and cannot produce production completion.

## Behavioral and Windows checks

The check command typechecks source, scripts and tests; executes the behavioral and keyboard suites; builds the CLI; and regenerates the deterministic historical gallery. Tests cover actual JSON/file writes, repeated saves, both duplicate choices, collision preservation, failed replacement, writer conflicts, corrupt/path-escaping import rejection, export/import round trips, missing files, changed recovery media, already-committed journals, pre-commit cancellation, deferred exit during commit, collection templates, field cursor editing, cursor visibility in long fields, paged help/details and terminal sizing.

The separate integration suite invokes the actual pinned executables. It:

1. Generates three original clips with FFmpeg, serves them over HTTP loopback, downloads them with yt-dlp into two collections, validates them with ffprobe, searches a note, handles a repeated source, exports and imports metadata.
2. Generates separate DASH video/audio tracks and verifies the saved MKV contains both streams, then saves an audio-only format.
3. Cancels a real Windows process tree and checks that its descendant is gone before cancellation returns.
4. Forcibly kills a writer after media promotion, detects its dead lock, explicitly releases it and recovers the verified journal once.
5. Cancels a slow actual yt-dlp HTTP download and checks that no completed record or staged file remains.
6. Checks missing tools and unavailable format/network/authentication/disk failures for actionable messages.

No skipped integration cases are accepted as a passing release run. The real-media evidence is [recorded separately](real-media-evidence.json). Fixtures are original generated material; these tests do not prove reliability of every public site.

## Terminal and visual scope

Controlled-stream production tests exercise the keyboard journey, duplicate choices, help, field selection, compact display, short-terminal guidance and raw-input cleanup. Real Windows pseudoconsole checks compare console input/output modes before and after normal exit, Ctrl+C and a deliberate post-render exception, and observe cursor restoration. All six actual Windows Terminal normal/SIGINT/error cases in ANSI light/dark colors restored console modes. The host harness and its exact input-dispatch scope are recorded in [terminal verification](terminal-verification.json).

The [demo captures](demo/README.md) contain actual production Ink output with real backend work. Annotated PNGs include light/dark comparisons; the 30-second video uses editorial timing. They are rendered terminal-text captures, not desktop screenshots. No screen-reader or general assistive-technology compatibility claim is made.

## Measurements and remaining limits

[Production measurements](production-baseline.json) record seven actual PTY first-paint samples, separate tool readiness, production JSON reads/writes on 1,000 synthetic records, search latency and full installed tool footprint. The original [phase 2 baseline](baseline.json) is retained with its narrower scope. First paint excludes OS process creation; metadata/search fixtures do not measure a representative user collection or public-network throughput.

Initial limitations: one public item at a time; common audio/video extensions; local NTFS; no cookies/login, playlists, cloud sync, verified moved-file relinking, transcripts, automatic updates, npm publication or non-Windows support. Exported URLs may be private; users control sharing. Recovery preserves media rather than broadly deleting unknown files.

## Release evidence

The release package is a committed source archive with version, exact source commit and SHA-256 checksum; external executables and personal libraries are excluded. Reproducibility is checked in a clean temporary checkout with npm ci, the complete check command, real-tool integration and CLI dependency checks. Public release/tag/asset verification is recorded in the [execution log](execution-status.md) and GitHub release notes after publication.
