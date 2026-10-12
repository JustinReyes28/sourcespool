# Comparison and provenance register

Checked 12 October 2026. The claims below are limited to the reviewed official project READMEs. Omission from a README is not proof of absence in all versions. SourceSpool's features are proposed or simulated until phase 3.

## Current alternatives and positioning

**Yoinks.** The reviewed README describes a terminal URL/format/download flow, themes, audio extraction and progress, powered by yt-dlp and Ink. It does not document a searchable collection catalogue, reference notes/tags, or catalogue export. SourceSpool's proposed difference is the reference-management journey around a saved item. [Official repository](https://github.com/pablostanley/yoinks), checked revision `6f03720813c22f907d3fb9ba98567f2169446b82`.

**Pinchflat.** Its README describes a self-hosted yt-dlp manager suited to channels/playlists, powerful naming rules, presets and media-center integration. Predictable filenames are already present here. SourceSpool proposes a Windows terminal workflow for individually curated references; it does not claim to invent naming templates. [Official repository](https://github.com/kieraneglin/pinchflat), checked revision `67d8bd5598f4461c5435bcc66fc8d02b00c607cb`.

**Tube Archivist.** Its README describes a self-hosted YouTube archive with subscriptions, downloads, metadata indexing and search. Searchable media catalogues already exist. SourceSpool's choice is a small, local, portable catalogue with user-authored reference context rather than operating a media server. [Official repository](https://github.com/tubearchivist/tubearchivist), checked revision `c7a7a682be6f4906ace96df3060b5670df8e895e`.

**yt-dlp.** The engine already supports output templates, metadata and archive-oriented controls. SourceSpool will provide a constrained product-facing adapter; engine capabilities are credited to yt-dlp. [Official documentation](https://github.com/yt-dlp/yt-dlp).

## Application and asset provenance

- **Yoinks:** inspiration only; MIT upstream; no source, layout, image, logo, fixture or dependency bootstrap code copied. Link and credit retained. A future adaptation requires a recorded component/revision and preservation of its notices.
- **Pinchflat / Tube Archivist:** comparison only; their repositories list AGPL-3.0 / GPL-3.0 respectively. No code copied, imported or bundled.
- **SourceSpool application, interfaces, fixture content and workflow sketches:** original work in this repository; MIT. Fixture titles, notes, paths and hashes are synthetic. URLs under example.com are illustrative and are never fetched by the prototype.
- **Original planning/research files:** supplied project context, preserved in this repository. Historical “ClipShelf” references denote the earlier working concept; current name is SourceSpool. The initial Yoinks README is preserved at [initial notes](initial-yoinks-notes.md).
- **No external fonts, photos, icons or screenshot assets** are bundled. Browser sketches use system fonts and original text. Terminal sketches inherit the user's font/theme.

## Pinned scaffold dependencies

- React `19.3.0`, MIT: [upstream](https://github.com/facebook/react). Imported through its public API; no local source modifications.
- Ink `8.0.0`, MIT: [upstream](https://github.com/vadimdemedes/ink). Imported through its public API; no local source modifications.
- TypeScript `7.0.2`, Apache-2.0: [upstream](https://github.com/microsoft/TypeScript). Development/build only.
- tsx `4.23.15`, MIT: [upstream](https://github.com/privatenumber/tsx). Development/test only.
- @types/react `19.3.0` and @types/node `24.10.0`, MIT: [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped). Development only.

Exact direct and transitive resolutions/integrity hashes are in `package-lock.json`. Installed package metadata is the dependency-license evidence; retain bundled dependency notices if later packaging redistributes dependencies. Selecting MIT for this original scaffold does not relicense external tools.

## Planned external processes

yt-dlp and ffmpeg are **not installed, invoked or bundled by this scaffold**. Phase 3 must pin tested versions and record their license/build provenance. yt-dlp documentation lists supported runtime and extra JS requirements that may vary by extractor. ffmpeg's effective distribution license depends on build configuration. Keep these tools separately user-installed initially; no silent binary downloads, cookies or arbitrary extra command options in the first release.
