# SourceSpool — phase 6: Android APK support

Prepared 18 October 2026, Asia/Singapore. Status: **planned; implementation not started**. The owner chose a regular installable Android app (APK). This plan does not create Android support or change the Windows v0.1.0 release.

[1. Product](PLAN-01-Product-and-Differentiation.md) · [2. Design + GitHub](PLAN-02-Design-Architecture-and-GitHub.md) · [3. Build](PLAN-03-Build-and-Improve.md) · [4. Validate + release](PLAN-04-Validation-and-GitHub-Release.md) · [5. Posting kit](PLAN-05-Marketing-and-Maintenance.md) · [6. Android APK](PLAN-06-Android-Support.md)

## Goal and feasibility

Deliver an installable phone app that saves permitted video/audio references, keeps source URLs, collections, tags and notes, and finds them again offline. A user should not need Termux, Node, Python or FFmpeg installed separately.

An Android port is technically plausible: [youtubedl-android](https://github.com/yausername/youtubedl-android) provides an Android wrapper around yt-dlp and an FFmpeg integration. That establishes an implementation route, not proof that SourceSpool works on a phone. Milestone 6.1 must prove the engine and packaging before the complete app is built.

The existing React/Ink terminal UI and Windows process/storage adapters cannot simply be packaged as an APK. Reuse the product rules, schema, original fixtures and workflow; implement a native mobile UI and platform adapters.

## First release boundary

- A signed, standalone **arm64-v8a APK**, distributed through this project's GitHub releases. Proposed minimum: **Android 10 / API 29**, to be confirmed against the owner's phone and the engine spike. Record the exact Android versions/devices tested; a proposed minimum is not a compatibility claim.
- Touch screens for Library/Search, Add/Review, Collections, Item Details, Transfer Progress/Recovery and Settings. Support system Back, portrait layout, larger text, light/dark mode and TalkBack labels.
- Paste one public HTTP(S) media URL or receive it from Android's Share menu. Share opens a draft; it never starts a download automatically.
- Keep the first release to one active download. Retain filename previews, duplicate choices, notes/tags/search, metadata import/export, verified file opening and recovery.
- Cloud sync, accounts, cookies/authenticated downloads, playlists, bulk downloading, iOS, 32-bit phones and Play Store publication are outside this phase. Windows and Android exchange files manually; there is no automatic synchronization.

## Architecture and compatibility contract

Create an `android/` Gradle project in the existing repository. Use Kotlin, Jetpack Compose, ViewModels/coroutines and repository interfaces. Keep UI independent of the download engine and storage. This follows [Android's architecture guidance](https://developer.android.com/topic/architecture/recommendations). Use [Room](https://developer.android.com/training/data-storage/room) for the phone's catalogue and durable job state, with Android settings stored separately.

Port the validation, naming, search, duplicate and import/export rules from [the current domain](src/domain/catalogue.ts). Reuse shared test vectors to check both implementations, including Unicode, UTC dates, Windows-safe filenames, case collisions, malformed URLs, import conflicts and size limits.

The interchange contract stays `schemaVersion: 1`: retain IDs, source identity, timestamps, hashes, byte counts, collection templates, tags, notes and portable relative paths. Do not export Android content URIs or private absolute paths as Windows filenames. Metadata exports do not contain media. A Windows → Android → Windows round trip must preserve valid metadata; missing media remains marked missing until separately copied and hash-verified.

Keep original Windows source and release behavior working. Android licenses, build versions and dependency records belong to the Android component; do not silently change the existing MIT license.

## Milestone 6.1 — prove the engine and choose dependencies

Before scaffolding the complete app:

1. Inventory existing JDK/SDK/Gradle caches and an available physical phone. Select exact compile/target SDK, minimum SDK, build tools and engine versions; pin verified artifacts and record their sources. Use current Android requirements at implementation time.
2. Build a minimal APK using an Android-compatible yt-dlp/Python engine and FFmpeg. The candidate above is **GPL-3.0 licensed** ([upstream license](https://github.com/yausername/youtubedl-android/blob/master/LICENSE)); resolve the Android distribution license, notices and corresponding-source requirements before adopting it. Record licenses for the exact FFmpeg build/configuration, Python, JavaScript runtime and bundled scripts as well. If unsuitable, select and prove another engine. Do not describe a GPL-based Android distribution as MIT-only.
3. Prove metadata inspection, a small original local-HTTP download, separate audio/video merge, hashing and cancellation on the phone. Confirm all engine descendants stop before deleting staging files.
4. Solve YouTube's JavaScript-runtime packaging explicitly. The Windows implementation supplies Node; the APK needs an Android-compatible runtime and matching EJS components. [yt-dlp's EJS guide](https://github.com/yt-dlp/yt-dlp/wiki/EJS) documents this requirement. Include pinned components in the APK; do not assume the wrapper supplies a working runtime.
5. Verify every native dependency and the APK on 16 KB page-size systems, following [Android's native compatibility guidance](https://developer.android.com/guide/practices/page-sizes). Record actual 4 KB/16 KB coverage on the relevant ABI. Arrange a compatible phone or remote ARM64 environment before committing to this gate; an x86-only result or alignment scan does not prove the ARM64 engine. If no suitable environment is available, keep this milestone incomplete rather than waiving the check. A successful desktop build is insufficient.

Acceptance: a recorded installable engine proof, exact dependency/license decision, measured APK size and no unresolved blocker for the declared platform scope. If this fails, stop expansion and revise the approach; do not declare Android support complete.

## Milestone 6.2 — native library and Android sharing

Build the touch workflow using original sample metadata first, then connect it to Room. Search titles, source URLs, notes and tags offline. Editing, navigation and collection selection must survive rotation and process recreation.

Receive `ACTION_SEND` text via the [Android sharing contract](https://developer.android.com/training/sharing/receive). Extract and validate a single URL; let the user choose if shared text contains several. Reject unsupported schemes and embedded credentials. Never turn shared text into executable arguments. Return users to a review draft, including after an existing app instance receives a new share.

Acceptance: paste/share → inspect → choose format → add context → review is usable on a real phone, and cancelled/back navigation retains the draft without starting a transfer.

## Milestone 6.3 — reliable downloads, storage and data controls

Use app-private storage for the live catalogue, staging and managed media. Reimplement file promotion and journals for Android; do not assume NTFS hard links or a database transaction can atomically commit a media file too. Persist job ownership and commit state; allocate without overwriting; hash the final file before marking its record completed. Recover idempotently after process death. Cancellation during commit must report the actual result. Test crashes before promotion, after final-file allocation, after hashing, after the Room commit and before staging cleanup. On restart, reconcile owned orphan files and stale jobs without silently deleting unrecognized files or marking unverified items completed.

Export metadata and copies of media through system pickers. Use [Storage Access Framework operations](https://developer.android.com/training/data-storage/shared/documents-files), retain grants when needed, and handle revoked grants or unavailable providers. Do not treat a content URI as a filesystem path or promise atomic operations on arbitrary providers. Avoid all-files access. Explain that uninstalling removes the private library; offer explicit media backup. Exclude managed media and private catalogue data from automatic cloud backup. On a failed export, list completed/partial files, preserve private originals, clean only owned partial copies when permitted, and retry without overwrite. Verify destination bytes/hash when the provider permits; report unverified copies truthfully. A cloud-backed picker destination can use cellular data independently, so identify the selected provider and offer local destinations for offline backups.

Open verified media through a [FileProvider/content URI](https://developer.android.com/training/secure-file-sharing) with temporary read permission; open validated source URLs with browser intents. Preserve notes/source information if media is absent.

Use [user-initiated data-transfer jobs](https://developer.android.com/develop/background-work/background-tasks/uidt) on API 34+ and a foreground transfer implementation on older supported versions. Provide progress and Cancel notifications, handle notification denial and OS stops, and respect background restrictions. [Long-running worker guidance](https://developer.android.com/develop/background-work/background-tasks/persistent/how-to/long-running) documents version-dependent limits; do not promise indefinite execution or automatic resumption after force-stop.

Data controls are part of the core flow:

- Default source inspection and media transfers to unmetered networks; allow an explicit per-job cellular override that covers inspection and saving. Stop/wait when a permitted connection changes to metered. Test this with the real subprocess engine, including reconnects.
- Show available format sizes and an unknown-size state. Require a deliberate Save action. Disable automatic thumbnails, external metadata prefetch and engine updates.
- Warn on exact source/format duplicates before transferring; check content-hash duplicates after verification.
- Keep retries bounded, show transferred bytes and allow a configured best-effort payload ceiling. Include inspection and retries in the budget, with at most one automatic retry per request. If the chosen engine cannot enforce the configured job limit across its processes, keep that job unmetered-only. Document buffering/overhead limits instead of claiming an exact carrier-data cap.
- Bundled tools initialize locally. A fresh install must not download an unannounced engine payload. Later tool updates require a separate explicit action and stated size.

Acceptance: saving a sample produces a verified, searchable record; cancel/network loss/OS stop cannot create a completed record for an unfinished file. Recovery preserves existing items, and offline library use causes no application network traffic.

## Milestone 6.4 — collection parity and Windows interchange

Complete collection creation, notes/tags, filename templates/previews, exact-source and content-hash duplicate choices, missing-file guidance, and previewed metadata import conflicts. Preserve the v1 JSON limits and validation.

Add a Restore Media action: select a local folder or files through the picker, preview matches using relative paths and stored hashes, resolve conflicts, then copy into the managed private library without overwrite. Hash-verify before attaching a file to imported metadata; leave unmatched items missing. Export a Windows catalogue, import it on Android, restore original test media through that action, and export metadata back to Windows. Moving metadata alone must not claim to transfer media. Export media copies without deleting originals or silently overwriting destination files.

Acceptance: three original items in two collections can be saved, found by a note, checked for duplicates, exported, and round-tripped through the Windows app with no metadata loss.

## Milestone 6.5 — qualify and release the APK

Use documented solo testing, consistent with the owner's earlier gate decision. Interviews and independent usability validation remain deferred; do not claim tester evidence that does not exist.

- Run Kotlin domain/repository tests, Room migration and job-recovery tests, meaningful Compose navigation checks, and the existing Windows checks.
- Test the oldest claimed Android version and a current version; include a physical arm64 phone, 16 KB native coverage, screen lock/backgrounding, app restart/force-stop, notification denial, rotation, low storage, metered-network changes, import conflicts and revoked export access. Narrow the published support range if coverage is unavailable.
- Record separate Android outcomes for YouTube, Facebook, X and Instagram: inspection and a small permitted download, or the actual failure/not-tested status, with device/date/engine versions. Extractor inclusion alone is insufficient. Enable compatibility claims only for verified cases; retain clear login/unsupported-source errors. At least one non-loopback public source must pass end to end for an Android release; if all external tests fail, the local proof is only a development build.
- Prefer original tiny local fixtures. Live-site checks are an explicit small test session, budgeted at up to **10 MB aggregate payload**, including metadata, media and retransmitted payload, with at most one automatic retry per request. Protocol overhead is additional and the counter is not a carrier-billing guarantee. If all engine traffic cannot be bounded/observed, test on an unmetered connection or stay local-only. Skip an unbounded/unknown-size case and mark it unqualified. Do not download external videos while writing this plan.
- Record the reference phone in 6.1. Proposed performance budgets: usable Library within 3 seconds of a cold launch and 1,000-item search p95 within 100 ms. Measure initial engine extraction separately. Measure APK bytes, installed footprint and staging/merge space too; document any changed release target and its reason before qualifying the release.
- Build a release-signed arm64 APK, verify its signature/checksum, fresh install, same-key upgrade and catalogue preservation. Keep signing keys and passwords out of Git; preserve the signing identity for later upgrades.
- Publish an Android-specific prerelease tag such as `android-v0.1.0-alpha.1`, the APK, SHA-256, exact source/dependency provenance, required license/source materials, installation/backup instructions and original phone screenshots. Do not overwrite the Windows v0.1.0 release.

Acceptance: the APK installs and completes the core task on the declared devices, passes integrity/recovery checks, and has a reachable GitHub release with truthful compatibility notes.

## Download budget

These are **planning allowances, not measured download sizes or promises**. They assume a Kotlin/Compose build with bundled Python/yt-dlp, FFmpeg and a JavaScript runtime. Replace them with resolved artifact sizes and cache inventory before implementation.

- **Writing Plan 6:** no Android SDK, emulator, dependency or media downloads. Only source/documentation checks and the small Git update.
- **6.1, first local build:** allow roughly **1.5–4 GB once** for a cold JDK/Gradle/SDK/dependency setup. Reuse installed tools; prefer a GitHub-hosted build when this avoids local cellular downloads. That still requires downloading a test APK before installing it on the phone.
- **6.2–6.4, further development:** reuse those caches; reserve **0–300 MB combined** for additional dependencies, subject to the chosen engine. This is not a recurring allowance per milestone. Repeated CI-built APK downloads can each consume the full APK size; avoid fetching every iteration. Source/release uploads, remote logs and cloud-backed exports also consume mobile data, even when build tools stay on a hosted runner.
- **Optional native rebuild/emulator:** either can add roughly **1–3 GB** of tooling/images. Do not install either by default; use compatible prebuilts, hosted builds and a real phone where possible. A required native compatibility fix still needs proving before release.
- **6.5, phone installation/release:** initial **50–150 MB APK download allowance**, including the bundled engine. Target the lower end with one ABI and no unused downloader modules. Reserve roughly **150–500 MB installed before media**; staging and merges need additional free space. These sizes must be measured in 6.1 and replaced before release.
- **Actual saved media:** variable and additional to every allowance above. A metadata-only export does not back it up.

Do not start bulk local downloads on the current cellular connection. Inventory caches and present actual component sizes first; move build downloads to an agreed Wi-Fi connection or hosted runner. This plan authorizes planning, not SDK installation or app implementation.

## Phase 6 completion gate

All five milestones are complete only when the standalone APK meets the recorded device scope, runs without separately installed terminal tools, preserves the core library workflow, protects the user's data budget, interoperates with v1 Windows metadata, and has a verified signed release. If engine, licensing, device testing or download-budget gates are unresolved, Phase 6 remains incomplete.

Phase 5 stays complete under its owner posting-kit gate. Social publication, ongoing feedback collection and maintenance campaigns are not added back by this plan.
