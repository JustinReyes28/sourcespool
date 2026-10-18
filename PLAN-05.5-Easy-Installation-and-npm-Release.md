# SourceSpool — phase 5.5: easy installation and npm release

Prepared 18 October 2026, Asia/Singapore. Status: **in progress; implementation and release qualification started 18 October 2026**. Requested after the owner identified that installing v0.1.0 requires developer setup. Scope expanded at the owner's request to refresh release/social documentation and reuse pre-existing downloads because the development connection uses limited cellular data. Execute this phase after the Phase 5 posting-kit handoff and before the planned Android work.

[1. Product](PLAN-01-Product-and-Differentiation.md) · [2. Design + GitHub](PLAN-02-Design-Architecture-and-GitHub.md) · [3. Build](PLAN-03-Build-and-Improve.md) · [4. Validate + release](PLAN-04-Validation-and-GitHub-Release.md) · [5. Posting kit](PLAN-05-Marketing-and-Maintenance.md) · [5.5. Easy installation](PLAN-05.5-Easy-Installation-and-npm-Release.md) · [6. Android APK](PLAN-06-Android-Support.md)

## Goal and user experience

Let a Windows user who has a supported Node/npm installation launch SourceSpool from any folder with:

~~~powershell
npx sourcespool
~~~

For a permanent installation:

~~~powershell
npm install -g sourcespool
sourcespool
~~~

These are **target commands for a future published package**. The unscoped npm name and publisher access have not been verified for this phase. A fresh user should need no repository clone, source extraction, TypeScript build, manual executable paths or administrator access under a user-writable npm prefix.

On first launch, reuse working tools if available; otherwise offer guided installation of verified tools, then ask for and confirm a library folder. Later launches reuse the saved setup. npm may also show its own package-install confirmation. One-command launch still requires Node/npm and can include setup prompts and downloads; this phase does not produce a standalone Windows installer.

## Current gap and release boundary

The current [package metadata](package.json) sets private to true and has no bin entry, publish file list or package-build lifecycle. The existing [CLI](src/cli.tsx) already has a Node shebang. The [release script](scripts/package-release.mjs) creates a source ZIP, and the [tool helper](scripts/setup-tools.mjs) installs into a checkout-relative .tools folder and prints a developer launch command. These are the specific gaps this phase must close.

Keep the qualified Windows 11 x64 / local NTFS / Node >=24.19.0 <25 scope initially. Verify and record exact Node/npm versions during implementation; widening support requires its own evidence. macOS, Linux, Windows ARM64, an EXE/MSI, bundled Node, Android, automatic tool updates and new downloader features are outside this phase. Phase 6 remains a separate APK project.

Proposed release: **v0.2.0**, with a prerelease such as 0.2.0-rc.1 for registry qualification. Preserve the existing library schema, settings compatibility, source-release history and manual tool-path options. Refresh the Phase 5 documentation and social posting kit as a required Phase 5.5 deliverable. Keep current public captions accurate for v0.1.0 while implementation is pending; finalize the new release copy after npm publication is verified. The owner continues to handle social publication independently.

## Cellular-data constraint and reuse of existing downloads

Use pre-existing, verified downloads for local implementation and testing before fetching anything again. Preserve the existing caches, installed tools and original demo assets. Keep the current dependency versions unless an implementation requirement or a confirmed issue justifies a change; avoid unrelated upgrades and new build/marketing dependencies.

Local inventory checked on 18 October 2026:

- **.npm-cache/** contains all 41 distinct current production dependency tarballs, totaling **1,569,551 bytes (about 1.6 MB)**; their integrity hashes were checked. Existing node_modules and the previous offline clean-build evidence also support local development without reinstalling packages online. Recheck completeness for the actual release lockfile, including development/platform-specific packages, before relying on an offline build.
- **.tmp/tools/yt-dlp.exe** is **17,840,399 bytes** and **.tmp/tools/ffmpeg.zip** is **114,768,076 bytes**. Their SHA-256 values match the recorded [tool provenance](docs/tool-provenance.md). Together they avoid about **132.6 MB** of repeat downloads. The existing extracted FFmpeg/ffprobe directory is under .tmp/tools/ffmpeg-9.0.2-essentials_build/.
- Existing screenshots, the original sample/demo media and the posting-kit archive are available locally. Reuse them; preparing new captions or rebuilding the ZIP does not require downloading media or design tools.

Execution rules:

1. Inventory and verify the relevant cache entries, archives, tool versions and licenses before reuse. Retain the source caches; copy or stage verified tools into isolated test/managed directories as needed. Do not run cache-cleaning or bulk reinstall commands that discard usable downloads.
2. Run routine local dependency installs with the project cache in offline mode, for example npm ci --offline --cache .npm-cache --no-audit --no-fund in the development checkout. For isolated test directories, use an explicit absolute cache path. An offline cache miss is a reason to identify the missing artifact and change the test location or schedule; do not silently retry with an unrestricted online install. Keep unrelated registry/update checks out of routine offline runs.
3. Adapt tool setup to accept an explicit local verified-artifact source, with its final flag/API selected during implementation. Use the same hash, extraction, staging and executable-validation path for local artifacts as for network downloads. Preserve the upstream checksum/provenance record; a matching filename alone is insufficient. Cached-tool setup, repair and repeat launches must not fetch binaries again. Invalid/missing artifacts must produce a repair choice rather than an automatic fallback download. Do not bundle these cached binaries into npm or GitHub source packages.
4. Run empty-cache installs, actual upstream tool downloads and anonymous public-registry verification on **GitHub-hosted Windows runners**. Their bulk downloads occur on the hosted machine. Locally, use the packed artifact, populated isolated caches and loopback-served original fixtures for routine regressions, failure simulation and real terminal/input checks. Keep clean online qualification distinct from cache-based local evidence; do not weaken the fresh-install release gate to save data. Record the hosted runner's actual OS separately: its results establish clean network/package behavior, while local supported Windows 11 qualification uses isolated state and verified cached artifacts.
5. Transfer only changed source/docs, small release packages and necessary evidence. Reuse existing screenshots/video; avoid uploading tool archives, node_modules, caches or duplicate media. Keep CI log/artifact retrieval small instead of downloading the full tool set back to this PC. If hosted verification is unavailable, leave the required online checks pending until another suitable connection/environment is available.

Planning allowance for project transfers on this PC: **10–30 MB download and 1–5 MB upload**, with a **suggested 50 MB total allowance** for small metadata, publication, documentation and evidence transfers. These are estimates, not measured limits or a guarantee; they assume current dependencies/tools are reused and clean bulk downloads run remotely. ChatGPT/app traffic, unrelated updates and large retries are excluded. Any unexpected bulk transfer should be deferred to a suitable connection or hosted runner rather than silently consuming cellular data. Record actual transferred bytes where measurable, plus estimates and their basis where not; distinguish hosted traffic from local cellular traffic.

Acceptance: demonstrate local offline package installation and local-artifact tool setup without network fallback, document cache hits/misses and reused versions/hashes, and record the separate hosted clean-install results. Recalculate the remaining budget if versions, test placement or required assets change.

## Milestone 5.5.1 — confirm the npm destination and make a distributable package

1. Check whether the owner can publish sourcespool on the public npm registry. Verify the actual npm account and package ownership; GitHub ownership alone does not establish npm access. If the name is unavailable, use a public package under a verified owner-controlled scope and document the exact npx command. Keep sourcespool as the installed executable name. Resolve this before advertising commands.
2. Remove the private publishing block when preparing the release. Add bin mapping sourcespool to dist/cli.js; preserve its shebang and verify the generated Windows command shim. Set the supported engines, os and cpu metadata, repository/homepage/issue links and publication destination/access deliberately. Keep the existing runtime platform guard for Windows-version guidance.
3. Use a files allowlist for compiled runtime code, required runtime assets, package metadata, the README, license and applicable notices. Audit runtime imports and file lookups so they work relative to the installed package. Exclude caches, tests, private libraries/settings, tool binaries, demo videos, posting archives and other development artifacts. Avoid accidentally shipping stale build output or unnecessary source maps.
4. Build in the maintainer environment with a prepack step and the checked-in lockfile. The published package must already contain its complete compiled CLI; consumers need only runtime dependencies. Installing it must not require tsx, TypeScript or a source checkout. Do not add install/postinstall downloads or compilation.
5. Read the displayed app version from release metadata instead of keeping the hardcoded 0.1.0 string. Inspect npm pack --dry-run --json, then create and test a real .tgz. Record the file list, package size, SHA-256 and release commit.

Acceptance: the packed artifact installs into an isolated user-writable npm prefix and its command runs --help and --version from an unrelated directory, without source files or development dependencies. Follow [npm package metadata](https://docs.npmjs.com/cli/v12/configuring-npm/package-json/) and [pack behavior](https://docs.npmjs.com/cli/v12/commands/npm-pack/).

## Milestone 5.5.2 — make dependency setup work outside a checkout

Move reusable tool-installation behavior into the shipped runtime and expose **sourcespool --setup**, including the explicit local-artifact reuse path defined above. Keep npm run tools:install as a developer wrapper around the same implementation. The setup command manages tools and settings without creating or modifying a media library.

Store managed tools under **%LOCALAPPDATA%/SourceSpool/tools/** in versioned directories, with a manifest of exact versions, hashes and download origins. Keep settings at their existing user location. Do not write into npm's cache, the global package directory or the current working directory. A package upgrade or npx cache cleanup must not remove tools or settings.

Honor --yt-dlp/--ffmpeg, environment variables and saved explicit paths before selecting managed tools or PATH executables. Check yt-dlp, FFmpeg and the adjacent ffprobe, including execution/version checks and the existing Node runtime integration. Working user-installed tools remain usable; invalid explicit paths need a clear repair choice. Reuse existing settings and libraries without rewriting catalogue data.

Before a managed installation, show the tool versions, upstream hosts, estimated download/disk requirements, destination and license/provenance links. Start downloads only after the user chooses the install action. Ordinary npm install, --help, --version and --check-tools must not download external tools. First-run startup may offer setup, but declining or cancelling must not start a download or create a library.

Pin and verify approved upstream artifacts using SHA-256 before executing or extracting them. Retain the current archive-path checks and external-license records. Stage downloads/extraction, validate the complete tool set, and activate it only after checks pass; preserve the last working installation on failure. Make setup idempotent, handle concurrent launches with explicit ownership, and offer retry/cleanup of owned partial work after interruption. Never overwrite or delete user-supplied executables. Explain network, permission, disk-space and checksum failures with a recovery action.

Acceptance: first install, repeat setup, cancelled/failed setup and repair all work under a standard Windows user, including paths with spaces/Unicode. A second launch reuses verified tools. Tool provenance, transfer size and installed footprint are recorded from the exact qualified versions rather than assumed from v0.1.0.

## Milestone 5.5.3 — finish the first-run and lifecycle flows

- Fresh launch: check runtime/platform, discover tools, offer setup if needed, ask for and confirm a writable library folder, remember successful choices, then open the production app. Keep explicit --library behavior. Show progress during setup and let Ctrl+C stop it cleanly.
- Existing user: reuse current settings, tool paths and library; changing npm installation mode or app version must not require moving media. Re-running --setup must preserve existing library settings. Saving new managed-tool paths happens only after successful validation.
- Diagnostics: keep --check-tools noninteractive, report resolved paths/versions and actionable failures with a nonzero status. With missing setup in a noninteractive session, explain the interactive --setup command and exit instead of waiting for input. --help documents both npm usage and manual overrides.
- Updates: document npx sourcespool@latest and npm install -g sourcespool@latest using the verified package name. Explain that a plain npx invocation can resolve an installed/cached version; show --version and an exact-version command for reproducible use. Updating the app does not silently download replacement tools or change the library schema.
- Uninstall: document npm uninstall -g sourcespool. Preserve settings, managed tools and media; explain their separate locations and how the owner can remove unwanted managed data. Keep media libraries outside app/package directories. No uninstall hook deletes user data.
- Troubleshooting: cover missing Node/npm, unsupported versions/platforms, npm PATH/prefix permissions and PowerShell script-policy errors. Where appropriate, show npm.cmd/npx.cmd/sourcespool.cmd without asking users to weaken machine-wide settings. Keep the manual source installation available for development.

Acceptance: a new user can follow the short README path without developer commands; an existing v0.1.0 library opens and retains IDs, tags, notes, hashes and media through upgrade, uninstall and reinstall. An installed global app can search a prepared local library offline; first-time npm/tool downloads still require network access.

## Milestone 5.5.4 — qualify the installed artifact on Windows

Extend GitHub-hosted Windows CI to pack once and exercise that artifact outside the repository, with a temporary user profile/settings location, user-writable npm prefix, separate empty npm cache and working folder. Do not let repository node_modules, .tools, prior settings or globally installed tools hide missing package contents. Use verified existing downloads for local development and terminal checks, with separate isolated test state. Record which tests use populated caches/local artifacts/loopback fixtures and which make real upstream downloads on hosted runners.

Required evidence:

- Both the temporary-prefix global install and npx/npm exec route reach the packaged CLI. --help, --version and failure exit codes work; installation also succeeds with lifecycle scripts disabled. No consumer build or app-owned automatic install download occurs.
- Missing-tool first run, explicit setup/decline/cancel, repeat setup, concurrent setup, interrupted transfer, checksum mismatch and repair preserve the last valid installation and avoid premature settings/library writes. Use controlled fixtures for repeatable failures, plus one real verified upstream setup on a clean GitHub-hosted Windows runner. Include a successful offline local-artifact setup and cache reuse test that fails if it attempts a network fallback.
- On the supported Windows 11 x64 environment, an actual local Windows Terminal/PowerShell session confirms interactive npx input, first-run prompts, setup progress, folder selection, reopening and Ctrl+C. Use the packed CLI with an isolated user profile/settings location, npm prefix and library, plus verified pre-existing npm/tool artifacts, so current settings or globally installed tools cannot hide first-run defects. Record this OS separately from the hosted runner; a Windows Server runner result alone does not qualify Windows 11 support. Pipe-only smoke tests do not establish terminal behavior.
- From the installed package, save and merge original loopback-served media, hash it, find its notes/tags, handle a duplicate and export metadata. Run the existing behavior and real-tool integration checks as regression coverage.
- Upgrade from a copied v0.1.0 fixture library, uninstall and reinstall preserve data and tool discovery. Exercise spaces/Unicode and a read-only current directory. Check failure messages on an unsupported Node/platform configuration without claiming support there.

Acceptance: record exact Windows/Node/npm/tool versions, artifact digest, install commands, results, download/installed sizes and terminal observations in a dedicated installation-evidence document. All required checks pass for the final stable candidate. Keep unperformed checks visibly incomplete.

## Milestone 5.5.5 — publish and verify the public installation

Prepare release notes, the exact tested tarball, checksums and evidence before publication. Confirm the owner's npm publisher access and current authentication requirements. Prefer [trusted publishing](https://docs.npmjs.com/trusted-publishers/) for subsequent automated releases where supported; handle any first-publication/account step explicitly without storing credentials in the repository or logs.

Publish a qualified prerelease under the next tag and verify installation from the public registry using the resolved package name. Then build, pack and qualify the final stable version and publish **that exact tested .tgz**, without rebuilding it at publication time. Follow [npm publish](https://docs.npmjs.com/cli/v12/commands/npm-publish/); check current registry requirements during execution.

Verify registry metadata, version, public access, dist-tag, executable mapping and integrity against the tested artifact. From a clean GitHub-hosted Windows environment, test both the published npx command and a global install, including first-run tool setup and a small original-media save. Verify the stable latest tag resolves to this release. A successful local npm link or GitHub ZIP alone cannot satisfy this gate.

Prepare the package README and release notes alongside Milestone 5.5.6 before the final stable pack, then finalize the social handoff against the verified stable registry results. Ensure links/images work on the npm package page. Link the npm package from the GitHub release, retain the manual source route, and update execution evidence with real URLs/results. Change the current npm-publication exclusion only when the release exists. Do not claim an EXE/MSI, universal site support or Android support.

If public verification fails, stop promotion, document the failed result and publish a corrected new version when ready. Keep the known-working version documented; use dist-tag changes or deprecation when appropriate rather than assuming a published version can be overwritten.

Acceptance: an anonymous user can install the intended stable public version using both documented routes, complete setup and open a working library without a checkout or build tools.

## Milestone 5.5.6 — refresh documentation and the owner social posting kit

Update the existing documentation and post-ready files for the actual npm release. Prepare drafts during implementation and test their commands against the candidate package; include the accurate README in the tested stable tarball. Finalize the current release links and social handoff after Milestone 5.5.5 verifies public installation. Until then, keep the current v0.1.0 kit clearly identified and label any future-release draft as unpublished.

Required deliverables:

- **[README.md](README.md):** lead installation with the verified npx and global-install commands; cover Windows/Node prerequisites, guided setup, reuse of installed tools/local verified downloads, first-run prompts, data requirements, manual overrides, update, uninstall and troubleshooting. Explain which downloads are needed for a fresh user versus an existing installation. Replace source-only wording where the new release changes it; retain the developer source route and remaining limitations.
- **[Posting-kit guide](docs/launch-kit/README.md):** update the release/package links, final version, supported environment, attachment instructions and download-size notes. Describe the complete first-run experience, including Node/npm and optional tool installation, without promising a standalone EXE or zero-download setup for new users.
- **[General](docs/launch-kit/general.txt), [Reddit](docs/launch-kit/reddit.txt), [X](docs/launch-kit/x.txt) and [LinkedIn](docs/launch-kit/linkedin.txt) captions:** provide ready-to-paste updated introductions announcing the verified npm release and easier installation, with the exact package/command, release links and concise platform prerequisites where space permits. Preserve upstream credit and the demonstrated library features. Check platform length/format, including X's weighted link length, without requiring social-account sign-in.
- **Posting assets and archive:** reuse existing workflow images/video with their real capture dates and provenance. Label v0.1.0 captures as workflow illustrations; do not present them as evidence of the new installation flow or silently relabel the captured app version. If an installation image is useful, capture the new local terminal flow using already installed tools and original fixtures. Rebuild a versioned posting-kit ZIP locally, update its download link, inspect its contents and alt text, and retain the historical v0.1.0 archive. Exclude private paths/settings, tool binaries and caches.
- **Supporting docs and evidence:** update [tool provenance](docs/tool-provenance.md), installation evidence, [project index](Project-Plans-2026-10-12.md) and [execution status](docs/execution-status.md) with the actual versions, cache-reuse results, cellular-transfer record and public release URLs. Check installation claims throughout the docs/launch-kit directory and related live documentation for consistency; preserve dated historical records as history.

All copy must match the verified release and real installation behavior. Reuse of cached files on this development PC does not establish the download size for a fresh user. Keep media-backup, site-availability and external-license qualifications accurate. No social posting, feedback collection or ongoing marketing/maintenance obligation is added; the owner publishes independently.

Acceptance: updated README, posting-kit guide, all four caption files and a checked versioned ZIP are ready for handoff; commands/links/version/support claims agree with the verified package. Local links resolve, the archive opens and contains the intended files, and any reused historical visuals are identified accurately. Record the handoff in execution evidence. Drafting the refresh now does not count as shipping these deliverables.

## Completion gate and planning status

- [x] npm destination, name and owner publishing access verified; exact public commands finalized.
- [x] Minimal compiled package and command shim verified outside the source tree.
- [x] Guided, verified, per-user tool setup works and recovers from failures.
- [x] First-run, diagnostics, update/uninstall and existing-library flows qualified.
- [x] Existing npm/tool downloads reused and verified; offline/local-artifact checks, hosted fresh-download checks and the local cellular-transfer record complete.
- [x] Installed-artifact CI, real Windows terminal checks and installation evidence complete.
- [ ] Stable npm publication and clean registry installations verified; GitHub/README links updated.
- [ ] Release documentation, posting-kit guide, all four social captions and a checked versioned ZIP updated and delivered to the owner.

Phase 5.5 ends with a verified public npm release, a usable first-run experience, documented reuse of downloads and cellular usage, and refreshed documentation/social posting files delivered to the owner. Writing this plan does not implement the package, download tools, authenticate to npm or publish a release. Those remain execution work; any owner-only credential or authentication step is handled when actually needed. Phase 5 remains complete, and Phase 6 remains planned.
