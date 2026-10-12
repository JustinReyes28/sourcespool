> Historical inspiration research, recorded before development. Repository statistics and source-file descriptions below refer to the upstream inspiration, not this new project.

# Yoinks

Your top pick.

[Original repository](https://github.com/pablostanley/yoinks)

A terminal video downloader built around yt-dlp, with a format picker, progress display, themes, and audio extraction.

## Snapshot

- GitHub stars: 5,768
- GitHub-reported repository size: 342 KB
- Stack: TypeScript / React / Ink
- Repository license: MIT
- Selected source/configuration files: 19; 65,003 bytes (63.5 KiB)
- Total tracked files on the checked branch: 31
- Default branch: main
- Latest repository push reported by GitHub: 2026-07-17 (UTC date; not a release date)

## Why it fits

Your top pick. Its compact interface shows how a polished product can sit on top of an existing engine. Study the URL-to-format-to-progress flow and how the UI is split into small components.

Difficulty assessment: Small to medium: the interface is approachable; downloader failures and platform differences take more care.

Runtime footprint: Node.js 18+, yt-dlp, and ffmpeg. The small repository does not include the eventual footprint of these tools and installed dependencies.

The 19 counted TypeScript files include tsup.config.ts; this is a source/configuration count.

## A spin you could build

**Proposed concept: ClipShelf — a personal media collection organised around saved items.**

These are suggested directions for your own project, rather than claims that no other tool has them.

- Attach tags and the original source link to each saved item.
- Detect duplicate items before saving another copy.
- Offer reusable naming and folder templates for different collections.

First version: Start with one URL, one selected format, a chosen output folder, and a local collection index. Add tagging and duplicate detection after that flow works.

## Files to inspect online later

- [src/cli.tsx](https://github.com/pablostanley/yoinks/blob/6f03720813c22f907d3fb9ba98567f2169446b82/src/cli.tsx)
- [src/app.tsx](https://github.com/pablostanley/yoinks/blob/6f03720813c22f907d3fb9ba98567f2169446b82/src/app.tsx)
- [src/lib/ytdlp.ts](https://github.com/pablostanley/yoinks/blob/6f03720813c22f907d3fb9ba98567f2169446b82/src/lib/ytdlp.ts)
- [src/theme.ts](https://github.com/pablostanley/yoinks/blob/6f03720813c22f907d3fb9ba98567f2169446b82/src/theme.ts)

## Sources

- [Project overview and README](https://github.com/pablostanley/yoinks#readme)
- [Dependency manifest](https://github.com/pablostanley/yoinks/blob/6f03720813c22f907d3fb9ba98567f2169446b82/package.json)
- [GitHub repository metadata](https://api.github.com/repos/pablostanley/yoinks)
- [Checked file-list metadata](https://api.github.com/repos/pablostanley/yoinks/git/trees/6f03720813c22f907d3fb9ba98567f2169446b82?recursive=1)

## How size was checked

Research date: 12 October 2026 (Asia/Singapore). Stars and repository size came from the public GitHub API. "Repository size" is GitHub's reported size in KB, not a measured clone, installed dependency, release-binary, or build size.

Source counts and byte totals were calculated from default-branch file-list metadata for .ts, .tsx, .js, .jsx, .go, and .rs files, excluding test files and test, fixture, vendor, dependency, generated-build, script, and example folders. They measure the project's own selected files, not dependency code or lines of code.

Selection: focused terminal utilities, at least 2,000 stars, and below 5,000 KB of GitHub-reported repository size. Difficulty and spin ideas are my assessments, not upstream promises.

Status: details only. No repository, source code, asset, dependency, or executable has been cloned, downloaded, or installed locally.
