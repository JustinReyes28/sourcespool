# SourceSpool

Save video and audio references with their source links, collections, tags and notes, then find them again in a Windows terminal.

[npm package](https://www.npmjs.com/package/sourcespool) · [Releases](https://github.com/JustinReyes28/sourcespool/releases) · [30-second demo](docs/demo/sourcespool-demo.mp4)

![SourceSpool confirms a saved reference with its filename, verified size and hash](docs/demo/03-saved.png)

## Install and start

Requires **Windows 11 x64**, **local NTFS storage** and **Node 24.19.0 or a later Node 24 release** (below Node 25). Install [Node 24](https://nodejs.org/en/download) first.

~~~powershell
npx sourcespool@latest
~~~

For a permanent installation:

~~~powershell
npm install -g sourcespool
sourcespool
~~~

Already installed? [Update to the latest release](#update).

First launch checks for yt-dlp, FFmpeg and ffprobe. If they are missing, it offers guided setup and asks before downloading them. You then choose and confirm a library folder; SourceSpool remembers it.

Tool setup needs about **133 MB of downloads** and **800 MB of free disk space**. Working tools can be reused. [Manual paths, offline setup and troubleshooting](docs/installation.md).

## Use your library

- **A** adds a public URL. Choose a video or audio format, add tags and a note, then review the filename before saving. **Tab** changes field; **Ctrl+K** changes collection.
- **L** searches titles, source URLs, tags and notes offline. Use **↑/↓** and **Enter** to open details, **O** to open verified media, or **U** to open its source.
- **C** creates a collection. **S** edits its filename template using `{collection}`, `{date}` (UTC), `{title}`, `{id}` and `{ext}`.
- Duplicate prompts let you **K**eep the existing reference or save a **N**ew copy. Existing files are never overwritten.
- **E** exports catalogue metadata. **I** previews an import and its conflicts. Exports contain source links, tags, notes and relative paths; **back up media files separately**.
- **R** reviews interrupted saves and library locks. Use it before manually changing recovery files.

**Esc** goes back or cancels, **Ctrl+G** opens help, and **Q** exits from Home. **Ctrl+C** stops work and exits after active processes or saves settle. Use a terminal at least 35 columns × 18 rows.

The [demo](docs/demo/README.md) shows a real save, note search, duplicate choice and metadata export using an original local sample.

## Update

Updates are manual. To update a permanent installation to the latest published npm release, close SourceSpool and run:

~~~powershell
npm install -g sourcespool@latest
sourcespool --version
~~~

Your settings, managed tools and media library are preserved. Existing v0.1.0 libraries remain compatible.

If you use SourceSpool without a permanent installation, launch the latest published release with:

~~~powershell
npx sourcespool@latest
~~~

## Uninstall

~~~powershell
npm uninstall -g sourcespool
~~~

Uninstalling removes the CLI package. Your settings, managed tools and media library are preserved.

## Storage and limitations

SourceSpool stores a local JSON catalogue and media in your chosen library folder. It verifies saved files with SHA-256 and keeps recovery information for interrupted saves. Settings and managed tools live under `%LOCALAPPDATA%/SourceSpool`.

This release handles one public item at a time. Playlists, login/cookie downloads, cloud sync and automatic tool updates are not supported. Other operating systems, network shares and cloud-synced folders are outside the supported setup. Source availability depends on yt-dlp and the site.

Missing files retain their metadata; restore media at its recorded path. Review source URLs before sharing an export. SourceSpool does not upload your catalogue, media, credentials or cookies.

## Development

~~~powershell
npm ci
npm run check
npm start
~~~

`npm run check` typechecks the project, runs behavior and keyboard tests, builds the CLI and regenerates the synthetic design gallery. Real-tool integration tests require yt-dlp and FFmpeg; see [Contributing](CONTRIBUTING.md).

[Architecture](docs/architecture.md) · [Tool versions and licenses](docs/tool-provenance.md) · [Validation scope](docs/validation-phase-3-4.md) · [Posting captions and images](docs/launch-kit/README.md)

## Credits and license

[Yoinks](https://github.com/pablostanley/yoinks) by Pablo Stanley inspired the terminal downloader concept. SourceSpool's application code, collection workflow, copy, captures and sample media are original.

SourceSpool is [MIT licensed](LICENSE). Dependencies and external tools retain their own licenses.
