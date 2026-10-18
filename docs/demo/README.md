# SourceSpool v0.2.0 workflow demo

Recorded on 18 October 2026 from the current development checkout. The six workflow images and 30-second video show a keyboard-driven production session: saving and hashing a clip with yt-dlp/FFmpeg, keeping its source and notes, searching by note, handling a duplicate and exporting metadata.

These are annotated renders of actual Ink terminal output. The sample is original generated media served over localhost, and library/export paths are redacted. Each video frame is held for five seconds. The capture covers the library workflow; it does not cover first-run installation or test an external site's availability.

- [Tags, notes and filename preview](01-context.png)
- [Review before saving](02-review.png)
- [Verified save](03-saved.png), with a [light alternative](03-saved-light.png)
- [Search by note](04-search.png)
- [Duplicate choice](05-duplicate.png)
- [Completed metadata export](06-export.png)
- [30-second video](sourcespool-demo.mp4)
- [Captured text, version, timestamp and observations](frames.json)

All seven PNGs are 1280 × 720. The [posting kit](../launch-kit/README.md) includes captions, attachment order and alt text.

## Reproduce

Install development dependencies and set `SOURCESPOOL_YTDLP` and `SOURCESPOOL_FFMPEG` to installed executables as shown in [Contributing](../../CONTRIBUTING.md). Rendering also requires Python with Pillow and the Windows Consolas/Segoe UI fonts.

From the repository root:

~~~powershell
npx --no-install tsx scripts/capture-demo.ts
python scripts/render-demo.py
& $env:SOURCESPOOL_FFMPEG -hide_banner -loglevel error -y -f concat -safe 0 -i docs/demo/video-inputs.txt -vf fps=24 -t 30 -c:v libx264 -pix_fmt yuv420p -movflags +faststart docs/demo/sourcespool-demo.mp4
python scripts/package-posting-kit.py --release
~~~

The recorder generates its sample locally and uses existing tools. It reads the version from the app; the renderer uses that recorded version in image headings. Regenerate the images, video and ZIP together after a new capture.
