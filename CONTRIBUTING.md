# Contributing

SourceSpool initially supports Windows 11 x64, local NTFS and Node 24.19.0.

Run npm ci and npm run check. Real-media validation additionally requires explicitly installed yt-dlp/FFmpeg tools and npm run test:integration; see the README for environment variables. Do not count fixture-only tests as downloader or recovery evidence.

Keep UI rendering/input in src/ui, orchestration in src/application, pure validation/naming/search in src/domain and external effects in adapters. Never spawn a shell with interpolated URLs. Final filenames are allocated without overwrite; completed catalogue entries follow observed nonempty final-file/hash verification. Keep atomic JSON writes, the writer lock, revision checks and recovery journals together.

Use original or permitted fixtures. Do not commit node_modules, .tools, .tmp, personal libraries/media, credentials, cookies or private exports. Demonstrate changes with focused behavioral tests; document supported environments and limitations.

The production app and synthetic design walkthrough are separate modes. Keep the gallery deterministic and label its simulated states. Product claims must match the release behavior and recorded validation.

Open an issue with steps, expected/observed behavior, application/runtime/tool versions and a redacted error. Do not post private source URLs or an entire personal catalogue. Research and beta observations remain deferred until people actually participate; solo checks are not human usability evidence.
