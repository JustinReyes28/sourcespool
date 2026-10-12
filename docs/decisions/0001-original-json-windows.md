# ADR 0001 — Original application, local JSON, Windows first

Status: accepted for phase 2, 12 October 2026.

We need a small reference collection whose media and source context can be understood and backed up locally. The selected direction is an original React/Ink application with narrowly scoped external-process adapters. Yoinks provides inspiration; no application source or assets are copied.

Choose versioned JSON with an exclusive writer lock, revision checking, same-directory replacement and a recovery journal. This keeps the catalogue inspectable and portable. SQLite would simplify transactions and larger libraries but introduces migration/binary/storage decisions before scale has been measured. Reconsider when measured search/write latency or concurrency requirements justify it.

Choose Windows 11 x64 and Node 24.19.0 first because this is the available development environment. Tested dependency portability does not establish support for other systems. Do not bundle yt-dlp/ffmpeg or download binaries automatically in the first build milestone; use explicit tool paths and startup checks.

Consequences: the JSON transaction/recovery boundary needs meaningful Windows tests, paths must follow Windows rules, and subprocess cancellation must stop process trees. Phase 2 demonstrates fixture states only. Its use of memory data is not a production persistence implementation.
