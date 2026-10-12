# Workflow and state ownership

Review the [original screen gallery](workflow.html). Run `npm run dev` in a terminal for the same screens with keyboard transitions. All prototype data is synthetic and in memory; the completed screen is explicitly simulated.

## Complete journey and state transitions

```text
Home ─Add→ Source ─Read→ Loading ─metadata→ Format
                                            │
Format ─Continue→ Organize ─Review→ Review ─Save→ Progress
                                                 │
                                     Verify completed file
                                      /                \
                                no match             hash match
                                   │                     │
                                Completed            Duplicate
                                   │                  /      \
                                Library       Keep existing  Save another
                                   │                 │           │
                                Details            Details    Completed

Loading / Progress ─failure→ Failure ─Retry→ Source
Loading / Progress / Duplicate ─Esc or X→ Cancelled ─R→ Source
Source / Format / Organize / Review ─Esc→ prior editable step
```

Production inserts source/format duplicate preflight before downloading and explicit verifying/committing job stages after progress. The gallery includes empty home/library, normal source/format/organize/review/library/details/settings, loading, progress, failure, cancelled, duplicate and completed states. Those production sub-stages are covered by the architecture contract, not a real engine in this scaffold.

## Ownership and persistence

One application-owned draft holds URL, format, collection, tags and note across wizard screens. Back never clears it. Loading reinspection invalidates stale format options in production; format choice must be confirmed against current metadata. Cancellation before promotion stops work, keeps the draft for this session and returns a recoverable state. During production promotion/commit, show “Finishing save; cancellation requested”, disable Back/Retry and settle the short critical section before reporting Saved or Recovery required. Honor a pending exit afterward. Exiting clears the transient draft. Help temporarily overlays the view without changing focus or draft; closing it returns to the same field.

Metadata belongs to the inspect result; progress/failure belongs to a job. Completed items belong to the catalogue only after file verification and commit. The prototype's fixture collection is separate from a production catalogue, never serialized, and cannot imply real files exist. Search belongs to Library and is preserved while opening/closing details. Naming settings are session previews only in phase 2; production settings save only after template validation.

## Keyboard and focus

- Home: A Add, L Library, S Settings. Other screens have one visible primary action, Enter where appropriate.
- Source: type/paste the URL, Ctrl+U clear, Enter read. The source starts with an example; it is labeled as a fixture. Production starts empty.
- Format: 1 video, 2 audio in the fixture; production uses Up/Down with an explicit selected row and Enter to choose available formats.
- Organize: tags first, Tab cycles tags/notes; Ctrl+K switches the fixture collection. Enter reviews the draft. Production adds a labeled destination picker alongside the collection settings.
- Library: type a query, Ctrl+U clear, Enter opens the first result. Production Up/Down selects among matches. No result leaves focus in search.
- Details: O file, U source and E export are visibly planned and return an explanatory notice in the prototype. No OS actions occur.
- Settings: type/paste a template, Ctrl+U clear. Preview changes immediately; no persistence or validation claim.
- Everywhere: Ctrl+G help, Esc back or close help; Ctrl+C exits. During loading/save/duplicate, Esc or X cancels. Failure/cancelled: R restores the draft; cancelled: H home. Duplicate: K existing, N another, X cancel.

Text shortcuts never steal ordinary text from input fields. Ctrl+C always exits, so changing the collection uses Ctrl+K. Help announces keys in the same footer position. Avoid binding letters such as Q globally while typing. Cursor editing and format-list selection beyond this basic prototype belong to phase 3 usability work.

## Resize, display and terminal lifecycle

Use the user's terminal font/theme and text/bold hierarchy; do not force background colors. This avoids a dark-only palette and color-only status. Layout wraps within the observed terminal width; below 60 columns it uses a compact hint and one column, with source/path text allowed to wrap. Production must also handle short terminal height with scrollable detail content and kept-visible focus; that is not implemented by the basic sketch.

The browser review has separately defined light/dark palettes and visible keyboard focus. It has no moving content. All screens include text state labels. Actual Windows terminal font/theme combinations and screen-reader behavior require phase 3/4 testing before accessibility claims.

Ink owns raw-input/cursor lifecycle. Phase 3 must exercise ordinary exit, Ctrl+C, resize, cancellation and thrown-error cleanup in Windows Terminal. The scaffold tests a controlled input/output stream plus process exits; these are narrower than an actual terminal restoration test.

## Error and cancellation copy

Invalid URL: “Enter an http or https URL without a username or password.” Retain input for editing.

Source failure: “The source could not be read. Check the URL, then retry.” No completed record; keep draft. Production distinguishes unavailable format, access/auth requirement, connectivity and dependency failures instead of mapping all errors to this one simulated case.

Destination denied: “This folder is not writable. Choose another folder or change its permissions.” Keep draft and do not start a download.

Catalogue failure: “The file was saved, but the catalogue could not be updated. Recover this verified item from the library.” Retain the journal and show the actual observed file outcome; never claim a rollback that did not happen.

Cancelled before promotion: “No completed record was added. Your source, format, tags and notes are kept for this session.” In production show staged cleanup status only after child processes close. After promotion begins, use the saved/recovery outcome described above instead of this cancellation copy.

Duplicate: show the existing item and explain both choices. Keep-existing returns details and may offer an explicit metadata edit later; it does not silently merge the new draft note. Save-another never overwrites.
