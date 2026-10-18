# Installation and troubleshooting

Requires Windows 11 x64, a local NTFS library folder and Node >=22.0.0. [Node 24 LTS](https://nodejs.org/en/download) is recommended. Run `npx sourcespool@latest` or install with `npm install -g sourcespool`.

## Node version errors in the published 0.2.0 package

Version 0.2.0 installs on Node 25 with an npm engine warning, but its own startup guard then refuses to run. That release only accepts Node >=24.19.0 <25; `--force` does not bypass the application guard.

Version **0.2.1** fixes this by accepting Node 22 and newer, including Node 25. Update a permanent installation, then launch normally:

~~~powershell
npm install -g sourcespool@latest
sourcespool
~~~

For a one-off launch, use `npx sourcespool@latest`. If you must run the older 0.2.0 package, use a temporary Node 24 runtime:

~~~powershell
npx --yes --package=node@24.19.0 --package=sourcespool@0.2.0 -- sourcespool
~~~

This downloads Node into npm's cache and uses it for this command without replacing your system Node. npm can still print the engine warning during installation because npm itself starts under your system Node. Append SourceSpool options, such as `--setup`, after `sourcespool`.

Node 22 is the minimum required by Ink and several terminal dependencies. The development pins do not limit which runtime users can launch with. Historical validation reports describe the version tested at the time.

## Tool setup

SourceSpool uses yt-dlp, FFmpeg and ffprobe. First launch offers guided setup when working tools are missing. You can also start setup directly:

~~~powershell
sourcespool --setup
~~~

Guided setup shows the versions, download hosts, destination and license links before asking to install. To explicitly request a download without the interactive prompt:

~~~powershell
sourcespool --setup --download-tools
~~~

The pinned artifacts total about 133 MB; allow 800 MB of free disk space during extraction and validation. Node and npm package downloads are additional. Managed tools live in `%LOCALAPPDATA%/SourceSpool/tools`; valid installations are reused across setup runs and app updates. The npm package does not bundle these binaries. [Pinned versions, checksums and licenses](tool-provenance.md).

### Reuse existing downloads

Place the pinned `yt-dlp.exe` and `ffmpeg.zip` artifacts listed in tool provenance in a folder, then run:

~~~powershell
sourcespool --setup --tool-cache "C:/Downloads/SourceSpool-tools"
~~~

The installer verifies their checksums. Missing or mismatched files fail without an online fallback.

To replace an incomplete managed installation:

~~~powershell
sourcespool --setup --repair --tool-cache "C:/Downloads/SourceSpool-tools"
~~~

Use `--download-tools` instead of `--tool-cache` to explicitly download the replacement. Cancellation or failure preserves the previous active installation. Older completed installations remain available for manual review.

### Use your own installed tools

~~~powershell
sourcespool --library "C:/Media/SourceSpool" --yt-dlp "C:/Tools/yt-dlp.exe" --ffmpeg "C:/Tools/ffmpeg/bin/ffmpeg.exe" --remember
sourcespool --check-tools
~~~

Keep ffprobe beside ffmpeg. `SOURCESPOOL_YTDLP` and `SOURCESPOOL_FFMPEG` also accept executable paths. Resolution order is command-line paths, environment variables, remembered paths, verified managed tools, then PATH.

`--library` creates or opens the specified folder; `--remember` saves the choices in `%LOCALAPPDATA%/SourceSpool/settings.json`. `--check-tools` prints resolved paths and versions, exits nonzero on failure, and does not download tools or write a library. `--setup` installs tools without opening a media library.

## Updates and removal

Run `npm install -g sourcespool@latest` to update a permanent installation, or `npx sourcespool@latest` to launch the latest package. Check `sourcespool --version`; use an exact published version for reproducible runs.

`npm uninstall -g sourcespool` removes the command and package. It preserves settings, managed tools and your chosen media library. Review any unwanted `%LOCALAPPDATA%/SourceSpool` files before removing them manually, and back up your library separately.

## Common issues

- If PowerShell blocks script shims, use `npm.cmd`, `npx.cmd` or `sourcespool.cmd`.
- If a command is missing, reopen the terminal and check npm's user prefix and PATH.
- For permission errors, use a user-writable npm prefix and library folder.
- If setup rejects the runtime, check `node --version` and `sourcespool --version`. Node versions below 22 require an upgrade; published 0.2.0 requires the Node 24 workaround above. Other operating systems remain unsupported.
- For tool failures, run `sourcespool --check-tools` and verify explicit paths before using `--setup --repair`.
- Missing tools in a noninteractive session produce instructions. Run guided setup in an interactive terminal or supply an explicit cache/download option.
