# Problem validation and pending interviews

Owner decision, 18 October 2026: interviews are deferred for this release. The owner approved documented solo validation and explicitly approved deferring the 3–5-person problem study. No interviews or independent tester outcomes are claimed; the audience and workflow hypotheses remain unvalidated.

Status: **pending external evidence**, 12 October 2026. No people were contacted and no sessions were fabricated. Phase 1 permits pending interviews if assumptions are explicit. Desktop research and a synthetic task walkthrough support a design hypothesis only.

Recruit three to five creators/students who already keep permitted media locally. Aim for at least one person who uses Downloads alone, one who organizes folders and one who uses an archive/downloader. Ask for an existing permitted item; use a synthetic item if it contains private information. The owner will recruit testers; this task does not message people.

For each 20-minute session, observe the user finding a reference saved about a month ago. Record their actual search/folder steps, time to find it, missing context and manual naming rules. Avoid presenting SourceSpool until after the existing task. Then ask:

- How do you currently find a clip saved a month ago?
- What metadata do you need when citing or reusing it?
- Which naming/folder rules do you repeat manually?
- What happens when you save the same clip twice?
- Would adding a note before saving interrupt your work?

Use anonymized participant IDs, tool/workflow, task outcome, observable friction, a short consented quote, and interpretation separated from observation. Do not record private media URLs in the repository. Keep raw interview notes outside Git.

The synthetic walkthrough exposed three design issues and resolved them: cancelling must retain the draft; duplicate matching must distinguish source identity from exact bytes; importing metadata must expose missing files instead of suggesting that the media was restored. These are design findings, not findings about user preferences.

Proceed with the current small-library audience as an explicit assumption. Revisit the scope if most observed users cannot use a terminal, care mainly about whole-channel subscriptions, or do not retain reference context. Tagging, duplicate prompts and file templates should each address repeated observed friction before release positioning claims are finalized.

The interview milestone remains in the issue backlog and does not block the phase 2 scaffold. The first-release validation task remains: save three permitted references into two collections, add tags and notes, find one by its note, repeat a reference and export/import the catalogue.
