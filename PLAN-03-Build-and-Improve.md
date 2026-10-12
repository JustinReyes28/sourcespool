# SourceSpool — phase 3: build the original product and improve the experience

Checked working product name: **SourceSpool**. See [name evidence](docs/research/name-check.md). Inspiration: [Yoinks](https://github.com/pablostanley/yoinks). Prepared 12 October 2026, Asia/Singapore.

Status: future phase; not executed by the current Plan 1/2 goal. Production implementation, release or marketing claims require the evidence specified below.

[1. Product](PLAN-01-Product-and-Differentiation.md) · [2. Design + GitHub](PLAN-02-Design-Architecture-and-GitHub.md) · [3. Build](PLAN-03-Build-and-Improve.md) · [4. Validate + release](PLAN-04-Validation-and-GitHub-Release.md) · [5. Market + maintain](PLAN-05-Marketing-and-Maintenance.md)

## Entry condition

Phase 2's workflow, architecture, and GitHub setup are complete. Build one usable path at a time. Each milestone below needs its demonstration before the next expansion.

## Build milestone 1: Build the complete single-item path

- Create the original home and add-item views.
- Read one URL through the download adapter, select one format, choose a destination, and display progress.
- Record the finished item in the catalogue.

Acceptance: A permitted sample saves successfully and is immediately discoverable from the library.

## Build milestone 2: Add the collection feature

- Create named collections, tags, notes, and metadata search.
- Open the saved file or its source from item details.
- Export and import a documented catalogue format.

Acceptance: A fresh catalogue import restores metadata and clearly identifies missing media files.

## Build milestone 3: Add deliberate file organisation

- Implement naming templates and filename previews.
- Calculate a content hash and present the duplicate choice.
- Handle moved or removed files without losing the original source information.

Acceptance: A repeated sample produces the duplicate prompt and never silently overwrites an existing file.

## Build milestone 4: Polish recovery and usability

- Handle interrupted downloads, unavailable formats, and failed dependency checks.
- Add consistent back/cancel shortcuts and a help overlay.
- Make the core path work in both light and dark terminals.

Acceptance: Cancel or failure leaves no completed catalogue entry pointing at an unfinished file.

## Improvements that must ship with the new capabilities

- Explain downloader failures in plain language and offer a precise next action.
- Keep keyboard navigation, help text, and terminal restoration consistent across every screen.
- Store a completed catalogue record only after the file exists and its metadata can be verified.

These improvements belong in the same acceptance review as the product-specific features. A visible success message must correspond to an observed completed operation, and cancellation/failure must leave a documented state.

## Keep implementation reviewable on GitHub

- Map each milestone to a GitHub issue with its acceptance criterion.
- Commit complete increments explaining the changed behaviour. Keep UI work, domain changes, and dependency updates understandable in review.
- Push the implemented increments to this product's own repository. Record which commit demonstrates each new capability.
- Update documentation and provenance whenever a dependency or adapted component changes. Link upstream inspiration accurately.
- Use checks for meaningful behaviours: data round trips, state transitions, and the operation boundaries relevant to this tool. Do not count screenshot resemblance or cosmetic differences as completion evidence.

## Evidence of the new product

Create a short walkthrough of the core journey using original sample content. For each of the three phase 1 differences, point to the implemented screen/action, its data behaviour, and the commit/issue that introduced it.

Maintain an implementation-status list: working, partially implemented, deferred. README claims and demo captions must match this list. If a proposed difference already exists elsewhere, revise the positioning around the actual workflow rather than claiming invention.

## Handoff to validation

Prepare the build, test fixtures, supported-environment list, and a concise explanation of known limitations. Save the expected beta task:

Save three permitted sample items into two collections, add tags, find one by its note, and export the catalogue.

Phase 3 finishes when the complete first-release task and all three planned differences work together, interrupted operations have defined outcomes, and the corresponding code/documentation is uploaded to the correct GitHub repository. Optional features remain in the backlog.
