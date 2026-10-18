# Contributing

SourceSpool supports Windows 11 x64, local NTFS storage and Node >=24.19.0 <25.

Run `npm ci` and `npm run check`. Real-media validation additionally requires installed yt-dlp, FFmpeg and ffprobe. Set paths to your own installed tools, then run:

~~~powershell
$env:SOURCESPOOL_YTDLP = "C:/Tools/yt-dlp.exe"
$env:SOURCESPOOL_FFMPEG = "C:/Tools/ffmpeg/bin/ffmpeg.exe"
npm run test:integration
~~~

See [tool setup](docs/installation.md) for installation options and [tool provenance](docs/tool-provenance.md) for qualified versions. Do not count fixture-only tests as downloader or recovery evidence.

Keep UI rendering/input in src/ui, orchestration in src/application, pure validation/naming/search in src/domain and external effects in adapters. Never spawn a shell with interpolated URLs. Final filenames are allocated without overwrite; completed catalogue entries follow observed nonempty final-file/hash verification. Keep atomic JSON writes, the writer lock, revision checks and recovery journals together.

Use original or permitted fixtures. Do not commit node_modules, .tools, .tmp, personal libraries/media, credentials, cookies or private exports. Demonstrate changes with focused behavioral tests; document supported environments and limitations.

The production app and synthetic design walkthrough are separate modes. Keep the gallery deterministic and label its simulated states. Product claims must match the release behavior and recorded validation.

Open an issue with steps, expected/observed behavior, application/runtime/tool versions and a redacted error. Do not post private source URLs or an entire personal catalogue. Research and beta observations remain deferred until people actually participate; solo checks are not human usability evidence.
