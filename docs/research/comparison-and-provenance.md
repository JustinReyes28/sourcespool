# Comparison and provenance register

Production provenance update, 18 October 2026: the application integrates explicitly installed yt-dlp 2026.08.19 and Gyan FFmpeg 9.0.2 Essentials through process boundaries. No external tool executable is included in the source release. Exact artifact checksums, licenses and invocation scope are recorded in ../tool-provenance.md.

Checked 12 October 2026. The claims below are limited to the reviewed official project READMEs. Omission from a README is not proof of absence in all versions. SourceSpool's features are proposed or simulated until phase 3.

## Current alternatives and positioning

**Yoinks.** The reviewed README describes a terminal URL/format/download flow, themes, audio extraction and progress, powered by yt-dlp and Ink. It does not document a searchable collection catalogue, reference notes/tags, or catalogue export. SourceSpool's proposed difference is the reference-management journey around a saved item. [Official repository](https://github.com/pablostanley/yoinks), checked revision `6f03720813c22f907d3fb9ba98567f2169446b82`.

**Pinchflat.** Its README describes a self-hosted yt-dlp manager suited to channels/playlists, powerful naming rules, presets and media-center integration. Predictable filenames are already present here. SourceSpool proposes a Windows terminal workflow for individually curated references; it does not claim to invent naming templates. [Official repository](https://github.com/kieraneglin/pinchflat), checked revision `67d8bd5598f4461c5435bcc66fc8d02b00c607cb`.

**Tube Archivist.** Its README describes a self-hosted YouTube archive with subscriptions, downloads, metadata indexing and search. Searchable media catalogues already exist. SourceSpool's choice is a small, local, portable catalogue with user-authored reference context rather than operating a media server. [Official repository](https://github.com/tubearchivist/tubearchivist), checked revision `c7a7a682be6f4906ace96df3060b5670df8e895e`.

**yt-dlp.** The engine already supports output templates, metadata and archive-oriented controls. SourceSpool provides a constrained product-facing adapter; engine capabilities are credited to yt-dlp. [Official documentation](https://github.com/yt-dlp/yt-dlp).

## Application and asset provenance

- **Yoinks:** inspiration only; MIT upstream; no source, layout, image, logo, fixture or dependency bootstrap code copied. Link and credit retained. A future adaptation requires a recorded component/revision and preservation of its notices.
- **Pinchflat / Tube Archivist:** comparison only; their repositories list AGPL-3.0 / GPL-3.0 respectively. No code copied, imported or bundled.
- **SourceSpool application, interfaces, fixture content and workflow sketches:** original work in this repository; MIT. Fixture titles, notes, paths and hashes are synthetic. URLs under example.com are illustrative and are never fetched by the prototype.
- **Original planning/research files:** supplied project context, preserved in this repository. Historical “ClipShelf” references denote the earlier working concept; current name is SourceSpool. The initial Yoinks README is preserved at [initial notes](initial-yoinks-notes.md).
- **Demo assets:** the included PNGs/video are original renders of captured production Ink text and generated sample media. No external photos, icons or font files are bundled. Windows system fonts are used for rasterization; the app inherits the terminal font/theme.

## Pinned application and development dependencies

- React `19.3.0`, MIT: [upstream](https://github.com/facebook/react). Imported through its public API; no local source modifications.
- Ink `8.0.0`, MIT: [upstream](https://github.com/vadimdemedes/ink). Imported through its public API; no local source modifications.
- string-width `8.3.0`, MIT: [upstream](https://github.com/sindresorhus/string-width). Unicode-aware terminal wrapping through its public API; the package was already present transitively.
- TypeScript `7.0.2`, Apache-2.0: [upstream](https://github.com/microsoft/TypeScript). Development/build only.
- tsx `4.23.15`, MIT: [upstream](https://github.com/privatenumber/tsx). Development/test only.
- @types/react `19.3.0` and @types/node `24.10.0`, MIT: [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped). Development only.

Exact direct and transitive resolutions/integrity hashes are in `package-lock.json`. Installed package metadata is the dependency-license evidence; retain bundled dependency notices if later packaging redistributes dependencies. Selecting MIT for this original scaffold does not relicense external tools.

## External processes

yt-dlp and FFmpeg are explicitly installed and invoked by the production adapter. Tested versions, exact checksums, effective licenses and publisher/source links are in [tool provenance](../tool-provenance.md). Their executables are excluded from the source release. Startup never downloads tools; the optional installer is an explicit separate command. Cookies, login handling and arbitrary extra engine arguments remain outside the first release.
