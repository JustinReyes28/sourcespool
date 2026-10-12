# SourceSpool

A Windows-first terminal tool for keeping a small media reference collection with its source, tags, notes and predictable folders.

**Current status: Plans 1 and 2 complete.** This repository contains an original React/Ink walkthrough, product/design/storage decisions and the next build milestones. It does not yet download media or persist a real catalogue. All demo items, hashes and completion states are synthetic. [Verified public repository](https://github.com/JustinReyes28/sourcespool).

## Review the design

- [Product brief and first-release scope](docs/product-brief.md)
- [Prioritized user stories](docs/user-stories.md)
- [Workflow sketches](docs/workflow.html) and [state/keyboard specification](docs/workflow.md)
- [Architecture, data model and recovery contract](docs/architecture.md)
- [Comparison, credits and provenance](docs/research/comparison-and-provenance.md)
- [Working-name check](docs/research/name-check.md)
- [Pending problem-validation interviews](docs/research/problem-validation.md)
- [Execution status](docs/execution-status.md) and [verification](docs/verification.md)

The proposed first release saves one permitted reference, keeps the reason and source beside it, makes tags/notes searchable, offers an explicit duplicate choice, and exports/imports a portable metadata catalogue. Those real-media behaviors are phase 3 work. The fixture demo demonstrates the intended interaction only.

## Run the scaffold

Use **Node 24.19.0** and npm. The lockfile pins dependencies. Node 25 is outside the current supported range.

```sh
npm ci
npm run check
npm run dev
```

`npm run dev` opens the keyboard walkthrough in an interactive terminal. Use A to add, Enter to continue, Esc to go back/cancel, Ctrl+G for help and Ctrl+C to exit. Use `npm run dev -- --empty` to begin with an empty example collection. The initial source URL is an example.com fixture and is never fetched.

After building, print an individual sketch without an interactive terminal:

```sh
node dist/cli.js --snapshot duplicate
node dist/cli.js --snapshot home --empty
node dist/cli.js --help
```

Open `docs/workflow.html` in a browser to inspect all 16 original screen sketches in light or dark display. The gallery switches sketches; the terminal demo exercises the state transitions. Both use the same presentation model.

`npm run baseline` measures snapshot startup, in-memory synthetic search and installed scaffold/build footprint. It requires an existing build and records its scope and host in `docs/baseline.json`; it does not measure real download speed, interactive first paint or production disk writes.

## Implementation boundaries

Working now: fixture wizard; editable tags/notes and collection choice; in-session metadata search; duplicate/failure/cancel simulation; draft retention; keyboard help; controlled resize behavior; static screen gallery; typed adapter contracts and checks.

Planned for phase 3: yt-dlp/ffmpeg integration; real file verification/hashing; safe destination/naming allocation; locked atomic JSON persistence and crash recovery; saved collection settings; real import/export and file/source opening; production error mapping; richer field/list navigation; short-terminal handling. Exact source/format duplicate preflight is also a production requirement.

The scaffold downloads no media and invokes no external downloader. It installs ordinary development libraries through npm. Phase 3 should initially use explicitly installed external tools with checked versions, rather than silently downloading binaries. Save only media you own or are permitted to keep.

## Structure and checks

`src/ui` contains the terminal views; `src/application` the fixture simulator; `src/domain` data types; `src/ports` the download/catalogue/file contracts; `src/adapters` original fixtures. Domain data types do not depend on the UI. The real coordinator/adapters will be injected in phase 3.

`npm run check` typechecks source, scripts and tests, runs the behavioral/keyboard tests, builds the CLI and regenerates the screen gallery. GitHub Actions runs the same checks on Windows with the pinned Node runtime. Tests prove the scaffold's state and keyboard behavior; they do not prove safe real-media writes or actual Windows Terminal restoration.

## Roadmap

1. [Plan 1 — product definition](PLAN-01-Product-and-Differentiation.md)
2. [Plan 2 — interaction, architecture and GitHub](PLAN-02-Design-Architecture-and-GitHub.md)
3. [Plan 3 — complete the production workflow](PLAN-03-Build-and-Improve.md)
4. [Plan 4 — validate and release](PLAN-04-Validation-and-GitHub-Release.md)
5. [Plan 5 — market and maintain](PLAN-05-Marketing-and-Maintenance.md)

The four next implementation issues are [published on GitHub](https://github.com/JustinReyes28/sourcespool/issues), with their reviewable bodies retained in [docs/issues](docs/issues). Human interviews remain explicitly pending; no observations or quotations are invented. There is no production release or npm package yet; `private: true` prevents accidental registry publication.

## Credits and license

[Yoinks](https://github.com/pablostanley/yoinks) by Pablo Stanley inspired the approachable terminal downloader concept. SourceSpool uses original application code, composition, copy and synthetic samples. No Yoinks source or assets were copied. The original research README is preserved in [the initial notes](docs/research/initial-yoinks-notes.md).

Original SourceSpool work is [MIT licensed](LICENSE). React/Ink and development tools retain their own licenses. Planned external-tool distributions require separate version/build/license provenance; our MIT license does not relicense them. [Contributing](CONTRIBUTING.md).
