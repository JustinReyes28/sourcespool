# Phase 5.5 installation evidence

Status: implementation, local qualification, stable npm publication and final hosted verification complete; PR merge and GitHub release finalization remain pending. [PR #5](https://github.com/JustinReyes28/sourcespool/pull/5) contains the reviewable work. [Structured evidence](installation-phase-5.5.json) records the exact scope and artifact digest.

## Local Windows qualification

Windows 11 x64 build 26200, Node 24.19.0 and npm 11.6.2. Required type/build/gallery checks and all 35 behavior/setup tests passed. All six original-media, merge, process-cancellation and forced-crash integration cases passed. The installed-package smoke test also saved and hashed an original loopback sample, found its note, kept a duplicate, exported metadata and merged separate audio/video streams.

The stable candidate is **0.2.0**, **38,921 bytes**, SHA-256 **cf77cc31330cb9c48706ac85c1c3421a26d95fefccd3ee718bb5e3e957a7537e**. Its 22-file allowlist contains compiled runtime code, package metadata, README, license and tool provenance; no tools, caches, tests or development dependencies. Full tool/media qualification and the corrected external-directory global/npx check produced identical artifact bytes.

A library and settings fixture created through the retained v0.1.0 implementation opened in the installed candidate and survived offline uninstall/reinstall with catalogue bytes, settings and media hash unchanged. No personal library was used.

Actual PowerShell/ConPTY checks covered setup decline, explicit cached setup, library selection/confirmation, remembered reopening and Q/Ctrl+C exits. A genuinely write-denied temporary working directory passed help and dependency checks; its original ACL was restored. Node 25.2.1 was rejected. Linux/arm64 process-configuration simulations exercised the runtime support message; they do not qualify a foreign OS/CPU. npm 11.6.2 did not reject a global --os=linux override, so support enforcement relies on the runtime guard as well as declared metadata.

## Hosted and public qualification

[Initial clean-host qualification](https://github.com/JustinReyes28/sourcespool/actions/runs/39110411381) and [installed-media qualification](https://github.com/JustinReyes28/sourcespool/actions/runs/39111023262) passed. The latter's candidate artifact SHA-256 exactly matched the local prerelease. The hosted OS build 26100 is recorded separately from local Windows 11.

The first public-registry npx check exposed that the temporary test directory was still nested under the source checkout, allowing npm's ancestor-package discovery to interfere. The test now uses the operating-system temporary directory outside the repository and checks the requested public version explicitly. [Corrected public-prerelease check](https://github.com/JustinReyes28/sourcespool/actions/runs/39111967649) and [stable-candidate check](https://github.com/JustinReyes28/sourcespool/actions/runs/39111970764) both passed. The corrected public check installed the prerelease from the registry and exercised its real tool/media workflow outside the source checkout.

The prerelease upload was accepted after owner-controlled npm 2FA/browser authentication. Public metadata for 0.2.0-rc.1 is readable and its SHA-512 integrity matches the tested 38,900-byte artifact. npm initially assigned both next and latest to this first version. The 0.2.0 stable version is publicly readable, latest points to 0.2.0, and its SHA-512 integrity matches the tested stable artifact. [Final public stable verification](https://github.com/JustinReyes28/sourcespool/actions/runs/39112764746) passed after correcting the no-app-data assertion to exclude PowerShell’s own cache. The GitHub release has not yet been published.

Repository naming maintenance updates the checkout's canonical repository links and package metadata to sourcespool. The published 0.2.0 tarball and its recorded hashes remain the original release; its older repository URLs use GitHub's rename redirects. These metadata changes will be included in a future npm release.

## Cellular data and posting handoff

Reused all 41 cached runtime tarballs (1,569,551 compressed bytes), yt-dlp (17,840,399 bytes), FFmpeg ZIP (114,768,076 bytes), and existing original demo media/images. **No external tool binaries were downloaded on this PC.** Fresh tool/dependency downloads ran on hosted Windows runners. Package publication payloads are about 39 KB each, plus registry/transport metadata; the checked posting-kit draft is 475,147 bytes.

No carrier byte counter was captured, so the precise total cellular transfer is unmeasured. The suggested 50 MB allowance remains a planning figure, excluding ChatGPT/app traffic and unrelated updates. Keep caches and test artifacts for reproducibility; no cache purge or bulk local redownload was performed.

The initial posting kit used historical v0.1.0 captures. On 18 October 2026 the [current kit](launch-kit/README.md) was refreshed with simplified captions and a new production capture from the v0.2.0 development checkout. Seven 1280 × 720 PNGs and the 30-second video were regenerated; the ZIP is 451,593 bytes. The [structured evidence](installation-phase-5.5.json) records its current SHA-256 and capture timestamp. Internal links, CRCs, source-file hashes and X's 191-character weighted length passed verification. [Earlier caption drafts](launch-kit/draft-v0.2.0/README.md) remain archived. The recorded PR/GitHub-publication hold remains pending independent confirmation; the owner handles social posting.
