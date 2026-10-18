# SourceSpool — phase 5: posting kit for the owner

Product: **SourceSpool**. Inspiration: [Yoinks](https://github.com/pablostanley/yoinks). Scope revised 18 October 2026, Asia/Singapore, at the owner's request.

Status: complete under the revised handoff gate. Captions and images are ready in the [posting kit](docs/launch-kit/README.md). The owner will publish social posts independently; no social post has been published by the agent.

[1. Product](PLAN-01-Product-and-Differentiation.md) · [2. Design + GitHub](PLAN-02-Design-Architecture-and-GitHub.md) · [3. Build](PLAN-03-Build-and-Improve.md) · [4. Validate + release](PLAN-04-Validation-and-GitHub-Release.md) · [5. Posting kit](PLAN-05-Marketing-and-Maintenance.md) · [5.5. Easy installation](PLAN-05.5-Easy-Installation-and-npm-Release.md) · [6. Android APK](PLAN-06-Android-Support.md)

## Goal and scope

Give the owner accurate captions and screenshots for introducing the released Windows terminal media library. Positioning: keep saved media with its source, tags and notes, then find it again.

The owner handles publishing on their own accounts. Feedback collection, report triage, bug fixes and later patch releases are outside Phase 5. There is no required feedback cycle, posting cadence, engagement target or maintenance commitment in this phase.

## Deliverables

- A [general caption](docs/launch-kit/general.txt) and tailored [Reddit](docs/launch-kit/reddit.txt), [X](docs/launch-kit/x.txt) and [LinkedIn](docs/launch-kit/linkedin.txt) copy, with real repository/release links and upstream credit.
- Six workflow PNGs and one light-theme alternative from the production session, with [attachment guidance and alt text](docs/launch-kit/README.md).
- An optional existing [30-second demonstration](docs/demo/sourcespool-demo.mp4).
- A small [posting-kit ZIP](docs/launch-kit/sourcespool-v0.1.0-posting-kit.zip) containing the captions, image files and handoff instructions. Existing local assets are reused; no packages, tools or media need downloading.

The images are annotated renders of captured production Ink output, using an original clip served locally. They show context entry, filename review, a verified save, note search, duplicate choices and metadata export. They do not demonstrate live YouTube, Facebook, X or Instagram compatibility. Exports contain metadata, not the media files. [Capture provenance](docs/demo/README.md).

## Release basis

The captions describe [v0.1.0](https://github.com/JustinReyes28/sourcespool/releases/tag/v0.1.0), qualified in [Phase 4](docs/validation-phase-3-4.md). Installation requires Windows 11 x64, Node 24, yt-dlp and FFmpeg; this is a source release. Captions do not claim universal site compatibility, independent user validation or a standalone installer. Interviews and independent usability research remain deferred with assumptions unvalidated.

## Completion gate

- [x] Provide copy the owner can paste, with no placeholders or feedback requests.
- [x] Provide original, inspected image files and explain what each shows.
- [x] Check feature claims, local links and the contents of the handoff archive.
- [x] Record that the owner owns social publication and that ongoing maintenance is outside this phase.

Phase 5 ends with delivery of this kit. Public posting is the owner's next action and is not a dependency for completing the agent's work.

A release-specific refresh of the README, posting-kit guide, all four social captions and the versioned ZIP is now required under [Phase 5.5](PLAN-05.5-Easy-Installation-and-npm-Release.md), using verified npm-release facts and existing local assets. This future handoff preserves the completed v0.1.0 Phase 5 record; the owner continues to publish independently.
