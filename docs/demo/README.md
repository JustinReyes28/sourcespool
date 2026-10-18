# Production workflow capture

The six PNGs and 30-second MP4 show a keyboard-driven production session in SourceSpool 0.1.0. The app called the real yt-dlp/FFmpeg adapter, saved and hashed an original generated clip, committed JSON metadata, searched its note, warned on an exact source/format repeat, and exported a catalogue.

These images are annotated renders of captured **Ink terminal text**, rather than desktop screenshots. They use actual application output; absolute library/export paths are redacted. The video holds each step for five seconds, so timing is editorial rather than a download-speed claim. The localhost source is an original fixture, not evidence about an external site's availability.

- [Context and naming preview](01-context.png)
- [Review before saving](02-review.png)
- [Verified save, dark](03-saved.png) and [light comparison](03-saved-light.png)
- [Search by note](04-search.png)
- [Duplicate choice](05-duplicate.png)
- [Metadata export](06-export.png)
- [30-second MP4](sourcespool-demo.mp4)
- [Captured text and observations](frames.json)

Reproduce with explicit tool environment variables: run tsx scripts/capture-demo.ts, then python scripts/render-demo.py (Pillow and Windows fonts), then encode video-inputs.txt with FFmpeg. Capture dependencies are development-only. These assets are prepared for phase 5; no social post has been published.
