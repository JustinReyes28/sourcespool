# External tool provenance

Tested on Windows 11 x64 / Node 24.19.0 on 18 October 2026.

## yt-dlp

- Version: 2026.08.19, upstream Windows x64 standalone executable.
- [Release and notices](https://github.com/yt-dlp/yt-dlp/releases/tag/2026.08.19).
- [Published SHA-256 sums](https://github.com/yt-dlp/yt-dlp/releases/download/2026.08.19/SHA2-256SUMS).
- Observed yt-dlp.exe SHA-256: 66674953fe251b89f4d08c5f0e35e0728679bd67ab3d7d05c0562af101dd3e7a.
- Observed executable size: 17,840,399 bytes.
- The bundled executable includes Python and third-party components; its combined distribution carries GPLv3+ requirements and the upstream third-party notices. SourceSpool's MIT license does not relicense it.

## FFmpeg and ffprobe

- Build: Gyan FFmpeg 9.0.2 Essentials, Windows x64 static build, including ffmpeg, ffprobe and ffplay (the app uses the first two).
- [Build publisher and license/build details](https://www.gyan.dev/ffmpeg/builds/).
- [Pinned archive](https://www.gyan.dev/ffmpeg/builds/packages/ffmpeg-9.0.2-essentials_build.zip) and [published checksum](https://www.gyan.dev/ffmpeg/builds/packages/ffmpeg-9.0.2-essentials_build.zip.sha256).
- Observed archive SHA-256: 60f467265b1e312373dbcd92200c2618a74850f98d3d078e94296bb3fa2047ba.
- This build is GPLv3; upstream FFmpeg/source and included libraries retain their notices and source obligations. The publisher links the exact source revision and build configuration.
- Observed three-binary directory: 317,548,544 bytes. Download archive size and installed size differ.

## Distribution and invocation

SourceSpool's source release contains no external tool executables. Users install them explicitly, or run the optional tools:install helper, which fetches these pinned upstream artifacts, verifies the published checksums and extracts them locally. Neither npm install nor application startup invokes the helper. CI explicitly invokes it as a test setup step.

Checksums detect mismatched bytes against the publisher's checksum; they are not an independent security audit. The runtime checks executable paths and version output. Other versions may be usable but are outside this recorded compatibility evidence.

The downloader ignores user downloader configuration, disables playlists and downloader caching, passes arguments with shell:false, uses the existing Node runtime for JavaScript support, and stages output inside the selected library. It does not install Python separately, handle cookies, upload catalogues or download tool updates.

Original generated color/sine/test-pattern samples and captured application text are used for validation and demo assets. No upstream application source or assets were copied.
