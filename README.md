# SourceSpool

A Windows terminal library for saving permitted media references, keeping their source and context, and finding them again.

Released: [v0.1.0](https://github.com/JustinReyes28/sourcespool/releases/tag/v0.1.0) · source archive about 0.62 MB.

Real downloading, saved collections, tags, notes, search, naming templates, duplicate choices and metadata import/export are implemented. The original synthetic design demo remains separate.

![A reference saved and verified in the production app](https://raw.githubusercontent.com/JustinReyes28/sourcespool/main/docs/demo/03-saved.png)

[30-second workflow](https://github.com/JustinReyes28/sourcespool/blob/main/docs/demo/sourcespool-demo.mp4) · [Capture details](https://github.com/JustinReyes28/sourcespool/blob/main/docs/demo/README.md) · [Posting captions and images](https://github.com/JustinReyes28/sourcespool/blob/main/docs/launch-kit/README.md) · [Release downloads and checksums](https://github.com/JustinReyes28/sourcespool/releases) · [Validation evidence](https://github.com/JustinReyes28/sourcespool/blob/main/docs/validation-phase-3-4.md)

## Install and start

**v0.2.0 npm release candidate is being qualified.** The existing [v0.1.0 source release](https://github.com/JustinReyes28/sourcespool/releases/tag/v0.1.0) remains available. Use the npm candidate command only after its publication is recorded in [installation evidence](https://github.com/JustinReyes28/sourcespool/blob/main/docs/installation-phase-5.5.md).

Supported: **Windows 11 x64, local NTFS storage, Node >=24.19.0 <25**. Install [Node 24](https://nodejs.org/en/download) first. Other platforms and Node 25 are outside the qualified range.

Run the candidate:

~~~powershell
npx sourcespool@next
~~~

Or install it permanently:

~~~powershell
npm install -g sourcespool@next
sourcespool
~~~

First launch checks your existing tools, offers setup if needed, then asks you to choose and confirm a writable library folder. It remembers successful choices. No repository clone, TypeScript build or administrator access is needed with a user-writable npm prefix.

### Tool setup and cellular data

SourceSpool needs yt-dlp, FFmpeg and ffprobe. Existing explicit paths, environment variables and remembered paths take priority; otherwise verified managed tools or PATH executables are used. Tools are never downloaded by npm install, help, version checks or dependency diagnostics.

Reuse downloads you already have (the pinned yt-dlp.exe and ffmpeg.zip):

~~~powershell
sourcespool --setup --tool-cache "C:/Downloads/SourceSpool-tools"
~~~

The current verified artifacts are yt-dlp 2026.08.19 and Gyan FFmpeg 9.0.2 Essentials. Their hashes are pinned in the app and recorded in [tool provenance](https://github.com/JustinReyes28/sourcespool/blob/main/docs/tool-provenance.md). A missing or mismatched cache file fails without an online fallback. This developer checkout already has them in .tmp/tools; ordinary new users need their own files or the explicit download option.

Run **sourcespool --setup** for guided setup. It shows the download hosts, versions, destination and license links before asking to install. An explicit noninteractive download is also available:

~~~powershell
sourcespool --setup --download-tools
~~~

Fresh tools require **132.6 MB download** (17.8 MB yt-dlp + 114.8 MB FFmpeg archive), plus a small npm package/runtime-dependency transfer. Allow **800 MB free disk space** during extraction and validation. Node's installer is additional if needed. Managed tools live in %LOCALAPPDATA%/SourceSpool/tools, independently of npm's cache/package directory. Repeat setup and app updates reuse valid managed tools. External tools retain their GPLv3+ licenses/notices and are not bundled in the npm package.

To repair an incomplete managed installation using existing downloads:

~~~powershell
sourcespool --setup --repair --tool-cache "C:/Downloads/SourceSpool-tools"
~~~

Cancellation/failure keeps the previous active installation. A later setup removes only identified incomplete work whose owner is no longer running. Older completed tool installations remain available; review them before manual removal.

### Existing libraries, diagnostics and manual paths

Existing v0.1.0 libraries and settings remain compatible. Settings stay at %LOCALAPPDATA%/SourceSpool/settings.json; your chosen media library stays separate. Setup does not create or alter a media library.

~~~powershell
sourcespool --check-tools
sourcespool --library "C:/Media/SourceSpool" --yt-dlp "C:/Tools/yt-dlp.exe" --ffmpeg "C:/Tools/ffmpeg/bin/ffmpeg.exe" --remember
~~~

SOURCESPOOL_YTDLP and SOURCESPOOL_FFMPEG are supported. --check-tools reports resolved paths/versions and exits nonzero on failure without library writes or tool downloads. --library explicitly creates/opens that folder; --remember saves the selection.

### Update, uninstall and troubleshooting

After stable publication, use npx sourcespool@latest or npm install -g sourcespool@latest. Plain npx can use an installed/cached version; check sourcespool --version and use an exact published version for reproducible runs.

~~~powershell
npm uninstall -g sourcespool
~~~

Uninstalling removes the npm command/package and preserves settings, managed tools and your separate media library. Remove unwanted %LOCALAPPDATA%/SourceSpool data manually only after reviewing it; media backups remain your responsibility.

If PowerShell blocks npm script shims, use npm.cmd, npx.cmd or sourcespool.cmd without changing machine-wide script policy. If the command is missing, reopen the terminal and check npm's user prefix/PATH. Use a user-writable npm prefix for permission errors. Unknown versions/platforms get a supported-runtime message. Noninteractive missing-tool setup exits with instructions instead of waiting for input.

### Build from source

For development or the historical source release:

~~~powershell
npm ci --offline --cache .npm-cache --no-audit --no-fund
npm run build
node dist/cli.js --setup --tool-cache ".tmp/tools"
npm start
~~~

Offline install requires a populated cache for the checked-in lockfile. New contributors without a cache can run npm ci on a suitable connection. The tool-cache command requires the verified artifacts; it never fetches missing files. The optional npm run tools:install wrapper uses the same installer after a build.

Android APK support remains [planned separately](https://github.com/JustinReyes28/sourcespool/blob/main/PLAN-06-Android-Support.md).

## Use the library

- **A** adds one public URL. Read metadata, choose a video or audio format with ↑/↓, and press Enter.
- Add comma-separated tags and a note. **Tab** changes field; **Ctrl+K** changes collection. Review the same filename template used for the save, then press Enter.
- Exact source/format matches warn before downloading. Matching completed-file SHA-256 hashes prompt after verification. **K** keeps the existing reference; **N** saves another. Existing media is never overwritten.
- **L** searches titles, URLs, tags and notes offline; all terms must match. ↑/↓ and Enter open details. **O** opens a verified media file; **U** opens its validated source.
- **C** creates a collection. **S** edits its persistent naming template. Tokens: {collection}, {date} (UTC), {title}, {id}, {ext}. End with .{ext}. Collisions receive a numeric suffix.
- **E** exports metadata to a new JSON file. **I** previews additions, conflicts and missing media before you choose which metadata wins. Exports do not contain media; back up the folders separately.
- **R** inspects interrupted commits and writer locks. Recover a verified item or keep its file unlisted. A stale lock is removed only on an explicit action after its owner is confirmed not running.

**Esc** goes back or cancels while retaining the session draft. **Ctrl+C** stops work and exits after the child process or commit settles. Cancellation during commit reports the actual saved/recovery outcome. **Q** exits from Home; **Ctrl+G** opens help. Fields support ←/→, Home/End, Backspace, Delete, paste and **Ctrl+U** to clear. **PgUp/PgDn** scrolls long review/details/help screens; the editing field follows its cursor. Very short terminals show resize guidance; at least 35 columns × 18 rows is required.

## Data, recovery and limits

The library contains catalogue.json, its last valid backup, collection folders, per-job staging and recovery journals. A completed record is stored only after nonempty media is hashed and the final file is observed. JSON updates use a single writer lock, revision checks, flushed temporary files and same-volume replacement. Use Recover before manually changing a lock or pending journal. [Storage contract](https://github.com/JustinReyes28/sourcespool/blob/main/docs/architecture.md).

Missing media keeps its source and metadata. Restore it at the expected relative path; verified relinking is deferred. Source URLs can be private, so review an export before sharing it. The app uploads no catalogue, media, credentials or cookies.

The current release excludes playlists, authenticated/cookie sources, cloud sync, accounts, transcripts, automatic tool updates and non-Windows support. Network shares and cloud-synced folders are untested. File opening is limited to common audio/video extensions and rechecks the stored hash. Public-source availability depends on yt-dlp and the site; recorded real-media checks use original locally served fixtures. Human research status and the approved solo-release gate are documented in [validation](https://github.com/JustinReyes28/sourcespool/blob/main/docs/validation-phase-3-4.md). No screen-reader compatibility claim is made from keyboard tests alone.

## Develop and verify

~~~powershell
npm run check
$env:SOURCESPOOL_YTDLP = (Resolve-Path ".tools/yt-dlp.exe").Path
$env:SOURCESPOOL_FFMPEG = (Resolve-Path ".tools/ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe").Path
npm run test:integration
~~~

The check command typechecks source/scripts/tests, runs behavioral and keyboard tests, builds the CLI, and regenerates the separate synthetic design gallery. Integration tests require explicitly installed tools. They generate original video/audio, download it over loopback HTTP, exercise FFmpeg merging, stop a real Windows process tree, and forcibly interrupt a writer before recovery. Windows CI runs both suites.

[Production measurements](https://github.com/JustinReyes28/sourcespool/blob/main/docs/production-baseline.json) distinguish first paint, tool readiness, JSON I/O, search and installed footprint. The original phase 2 baseline remains a dated, narrower measurement.

Production boundaries: terminal views → application controller/coordinator → domain validation/naming → local-library/downloader/opener adapters. UI code performs no process spawning or filesystem writes. The simulator and original 16 design sketches are retained as design references; run **npm run demo** or **node dist/cli.js --snapshot home**.

## Plans and credits

[Product](https://github.com/JustinReyes28/sourcespool/blob/main/PLAN-01-Product-and-Differentiation.md) · [Design](https://github.com/JustinReyes28/sourcespool/blob/main/PLAN-02-Design-Architecture-and-GitHub.md) · [Build](https://github.com/JustinReyes28/sourcespool/blob/main/PLAN-03-Build-and-Improve.md) · [Validate/release](https://github.com/JustinReyes28/sourcespool/blob/main/PLAN-04-Validation-and-GitHub-Release.md) · [Posting kit](https://github.com/JustinReyes28/sourcespool/blob/main/PLAN-05-Marketing-and-Maintenance.md) · [Easy installation plan](https://github.com/JustinReyes28/sourcespool/blob/main/PLAN-05.5-Easy-Installation-and-npm-Release.md) · [Android plan](https://github.com/JustinReyes28/sourcespool/blob/main/PLAN-06-Android-Support.md) · [Execution evidence](https://github.com/JustinReyes28/sourcespool/blob/main/docs/execution-status.md)

[Yoinks](https://github.com/pablostanley/yoinks) by Pablo Stanley inspired the approachable terminal downloader concept. SourceSpool's code, collection workflow, copy, captures and sample media are original; no Yoinks source/assets were copied. [Comparison and provenance](https://github.com/JustinReyes28/sourcespool/blob/main/docs/research/comparison-and-provenance.md).

Original application code is [MIT licensed](https://github.com/JustinReyes28/sourcespool/blob/main/LICENSE). React/Ink and all external tools keep their own licenses. [Contributing](https://github.com/JustinReyes28/sourcespool/blob/main/CONTRIBUTING.md).
