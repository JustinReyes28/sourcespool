# SourceSpool v0.1.0 posting kit

Prepared 18 October 2026, Asia/Singapore. The owner will post online independently. Captions and image files are the Phase 5 deliverable; collecting feedback and maintaining later releases are outside this phase.

[Download the complete posting kit ZIP](https://github.com/JustinReyes28/sourcespool/raw/refs/heads/main/docs/launch-kit/sourcespool-v0.1.0-posting-kit.zip) (about 0.47 MB): captions, seven PNGs and the optional demo video.

## Copy to paste

- [General caption](general.txt): a product introduction for a longer social post.
- [Reddit title and body](reddit.txt): paste the title and body into their separate fields; omit the TITLE/BODY labels.
- [X caption](x.txt): a short introduction with the repository link.
- [LinkedIn caption](linkedin.txt): the workflow and release details.

Each file contains plain text and real links. Captions credit Yoinks and describe released behavior. Choose the caption and attachments, then publish from your own account when ready.

## Attachments

For one image, use [note search](../demo/04-search.png), which shows why the library is useful. For a short sequence, attach context, saved, search and duplicate in that order. The complete workflow has six images; the light image is an alternative to the dark saved image.

1. [01-context.png](../demo/01-context.png) — tags, notes, collection and filename preview.
2. [02-review.png](../demo/02-review.png) — source and destination review before saving.
3. [03-saved.png](../demo/03-saved.png) — saved file, verified byte count and hash.
4. [04-search.png](../demo/04-search.png) — search finds a clip through its note.
5. [05-duplicate.png](../demo/05-duplicate.png) — keep the existing reference or save another.
6. [06-export.png](../demo/06-export.png) — completed metadata export and the separate-media-backup explanation.

Alternative: [03-saved-light.png](../demo/03-saved-light.png).

All seven PNGs are 1280 × 720 and total about 0.30 MB. Keep the footer visible: these are annotated renders of actual production Ink terminal text, using an original local sample. Absolute library/export paths are redacted. They are not desktop screenshots or evidence that a particular external platform works. No media or tools were downloaded to assemble this kit. [Capture details](../demo/README.md).

The [existing 30-second video](../demo/sourcespool-demo.mp4) is optional and is included in the posting-kit ZIP. Its five-second holds are editorial timing, not a download-speed measurement.

## Alt text

- **01-context.png:** SourceSpool's organize screen shows the Field notes collection, tags light and reference, the note "Look at the reflections," and a destination filename preview. Annotated capture of production terminal output.
- **02-review.png:** SourceSpool's review screen shows an original local sample URL, MP4 format, tags, note and destination path before saving. Annotated capture of production terminal output.
- **03-saved.png:** SourceSpool confirms the sample clip was saved, showing its relative path, 77,086 verified bytes and a SHA-256 hash prefix. Dark rendering of captured production terminal output.
- **04-search.png:** Searching for "reflections" returns prism-study with tags light and reference because the word appears in its saved note. Annotated capture of production terminal output.
- **05-duplicate.png:** SourceSpool detects that the source and selected format already exist and offers K to keep the existing reference or N to save another with a unique filename. Annotated capture of production terminal output.
- **06-export.png:** SourceSpool confirms a catalogue metadata export and explains that media files need a separate backup. Annotated capture of production terminal output.
- **03-saved-light.png:** The saved confirmation in a light rendering, showing the same relative path, verified byte count and hash prefix as the dark image.

## Release and credit

[Repository and setup](https://github.com/JustinReyes28/sourcespool) · [v0.1.0 source release](https://github.com/JustinReyes28/sourcespool/releases/tag/v0.1.0).

Windows 11 x64 and Node 24 are the tested environment. yt-dlp and FFmpeg are required separately. SourceSpool is MIT licensed; external tools retain their own licenses. [Yoinks](https://github.com/pablostanley/yoinks) inspired the terminal download concept; SourceSpool's application code, workflow, copy, captures and sample media are original.

The demo uses localhost media. Live YouTube, Facebook, X and Instagram availability has not been qualified in this release. Independent usability testing and problem-study interviews remain deferred. Full setup and limitations are in the repository README.
