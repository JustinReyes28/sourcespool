# SourceSpool product brief

Decision date: 12 October 2026 · Owner: JustinReyes28 · Phase 1 complete with research assumptions recorded.

## Audience and job

Independent creators and students who keep a small collection of their own or permitted reference media on a Windows computer. Their job: **save a reference, remember its source and why it matters, then find it again without searching Downloads.** Researchers are a secondary audience until citation needs are validated.

The problem is a hypothesis from the initial project notes, not observed user research. Three to five interviews remain pending. See the [research protocol](research/problem-validation.md).

## Positioning and three concrete differences

SourceSpool organizes the saved reference after a download. Yoinks inspires the approachable terminal workflow; this application has original code, composition, copy and examples.

1. **Reference context:** collections, tags, notes and source links searched together. The user can find “reflections” from a note and still recover the original source.
2. **Deliberate duplicates:** an exact source/format match warns before work; a completed-file SHA-256 match asks to keep the existing reference or save another with a unique filename.
3. **Predictable storage:** reusable collection naming templates, a destination preview and a portable catalogue export. Files and metadata can be backed up together.

These are proposed differences from the reviewed Yoinks workflow, not inventions or unique features across the market. Pinchflat already documents naming rules; Tube Archivist already documents archive search. See [comparison and provenance](research/comparison-and-provenance.md).

## First-release journey

Open a local library → Add one URL → Read metadata → Select one video or audio format → Choose a collection, tags and note → Review filename/destination → Save → Verify the file and handle any duplicate → Commit metadata → Find the item by its note → Inspect source and file → Export the catalogue.

For example, the original synthetic “Rain on the studio window” reference belongs to Field notes, has rain/texture tags, and a note about reflections. The prototype demonstrates this journey without fetching or creating media.

## Release boundary

Must include: the single-item journey; two or more collections; tags/notes/search; explicit duplicate choice; validated naming previews; catalogue export/import with missing-file status; useful errors; keyboard help/back/cancel; startup dependency checks. A completed record must reference a verified file. Never silently overwrite a file or record success for a partial download.

Deferred: playlists, whole-channel scraping, cloud sync, accounts, billing, transcripts, cookies/authenticated sources, browser integration, platform expansion and npm publication. The phase 2 scaffold is a design prototype; the real downloader and persistent catalogue belong to phase 3.

## Decisions and evidence

Use an original TypeScript/React/Ink application. Reuse maintained libraries through their public interfaces; copy no upstream application code or assets. Choose MIT for our original code. Use versioned local JSON first; SQLite requires measured evidence. Windows 11 with Node 24 is the initial target; other platforms are unclaimed.

Working name: **SourceSpool**. ClipShelf was rejected because of the existing Microsoft Store app. Exact web/name searches and GitHub repository checks found no matching SourceSpool product/repository on 12 October; this is a practical naming check, not legal clearance. [Name evidence](research/name-check.md).

On 18 October 2026, the owner confirmed **SourceSpool** as the public product name, with **sourcespool** used for the npm package, CLI command and GitHub repository. The earlier ClipShelf name is retained only in historical records and the existing local checkout path.

Success is a tested release journey, not prototype polish: a tester saves three permitted items into two collections, finds one through its note, handles a repeated item and restores metadata from an export. Completion and feature claims wait for phase 3/4 evidence.
