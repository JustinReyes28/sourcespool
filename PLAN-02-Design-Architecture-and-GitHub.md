# SourceSpool — phase 2: interaction design, architecture, and GitHub setup

Checked working product name: **SourceSpool**. See [name evidence](docs/research/name-check.md). Inspiration: [Yoinks](https://github.com/pablostanley/yoinks). Prepared 12 October 2026, Asia/Singapore.

Status: executed 12 October 2026. The original scaffold is verified in the public [JustinReyes28/sourcespool repository](https://github.com/JustinReyes28/sourcespool), Windows checks pass, and all four phase 3 milestone issues are published. See [workflow sketches](docs/workflow.html), [state specification](docs/workflow.md), [architecture](docs/architecture.md), and [execution evidence](docs/execution-status.md). The original plan steps below remain as the phase specification.

[1. Product](PLAN-01-Product-and-Differentiation.md) · [2. Design + GitHub](PLAN-02-Design-Architecture-and-GitHub.md) · [3. Build](PLAN-03-Build-and-Improve.md) · [4. Validate + release](PLAN-04-Validation-and-GitHub-Release.md) · [5. Posting kit](PLAN-05-Marketing-and-Maintenance.md) · [6. Android APK](PLAN-06-Android-Support.md)

## Entry condition and goal

Phase 1 has a defined audience, first-release journey, and provenance decision. Translate that decision into an original interface and a small design that can be built incrementally.

## Design the complete workflow

Home shows collections and recent items. Add opens URL, format, tags, and destination steps. Library offers search and item details. Settings manages naming templates.

Sketch normal, empty, loading, failure, cancelled, and completed states. Define which state owns a user's changes and what happens when they go back. Specify keyboard navigation, focus, terminal resize, plain-language errors, and light/dark display before implementing polish.

Use original sample content to walk through the full task. Resolve confusing steps in the sketch before adding more features.

## Proposed components

- Terminal interface: React/Ink views designed around collections and item details.
- Download adapter: use yt-dlp/ffmpeg through a narrow interface; treat remote metadata and process output as data.
- Catalogue service: start with a versioned local JSON index, atomic writes, and a replaceable storage interface.
- File service: normalise filenames, validate destinations, hash completed files, and export portable metadata.

Proposed data model:

Item: id, sourceUrl, title, createdAt, relativePath, bytes, hash, tags[], notes, collectionId. Job: id, stage, selectedFormat, progress, failureReason. Collection: id, name, namingTemplate.

Design decision: Choose a file-based catalogue first so users can inspect and back it up. Move to SQLite only if measured search or update costs justify migration.

Document storage location, format versioning, import/export behaviour, and recovery from partial writes. Choose a supported Windows-first environment and pin the eventual runtime/dependency requirements. Broaden platform claims only after testing them.

## Keep the build small

- Separate the user interface, the product's domain rules, persistence, and external adapters.
- Build against small fake adapters and original fixtures before testing remote services or real operating-system actions.
- Implement the first-release scope from phase 1. Put optional integrations behind an explicit backlog decision.
- Record a baseline for start-up, primary task responsiveness, and installed footprint on a named test machine. Set targets after observing that baseline.

## Required GitHub milestone: one repository for this product

Public GitHub publication is the intended outcome. Select the owner and checked repository name during setup; the development visibility and publishing date remain implementation decisions.

1. Choose the user's GitHub owner, checked repository name, and intended visibility; names and account details are not invented in this plan.
2. Prepare the original scaffold locally, with the product brief, five phase plans, README, selected project license, ignore rules, and provenance/credits.
3. Create the separate remote repository under that chosen owner and visibility. [GitHub repository creation](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)
4. Push reviewed local commits, then verify their remote contents. [Adding local code to GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
5. Record the actual URL in the local notes. Create issues for the phase 3 milestones and configure relevant build/type checks.

Keep generated dependencies, private local data, credentials, and machine-specific settings out of the committed tree. Review the concrete staged files before an upload. This execution includes the original scaffold and its reviewed upload; production media features remain phase 3 work.

## Outputs and exit criteria

Outputs: workflow sketches, state transitions, data model, dependency decisions, provenance register, original scaffold, and a verified GitHub repository URL.

Complete when the main journey and recovery states can be demonstrated from the sketches, persistence rules are defined, and the first reviewed scaffold is visible in the correct remote repository. Phase 3 depends on this recorded setup.
