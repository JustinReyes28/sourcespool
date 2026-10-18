# Installation and troubleshooting

Requires Windows 11 x64, a local NTFS library folder and Node >=24.19.0 <25. Install [Node 24](https://nodejs.org/en/download), then run `npx sourcespool@latest` or install with `npm install -g sourcespool`.

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
- If setup rejects the runtime, check `node --version`. Node 25 and other operating systems are outside this release's support range.
- For tool failures, run `sourcespool --check-tools` and verify explicit paths before using `--setup --repair`.
- Missing tools in a noninteractive session produce instructions. Run guided setup in an interactive terminal or supply an explicit cache/download option.
