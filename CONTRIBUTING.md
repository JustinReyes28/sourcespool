# Contributing

SourceSpool is a phase 2 design scaffold. Start with the product brief and architecture; the four phase 3 issues describe the next implementation milestones. Keep fixture simulation separate from real media operations and keep README claims matched to observed behavior.

Use Node 24.19.0 and the lockfile: `npm ci`, then `npm run check`. The check typechecks source/scripts/tests, exercises design and keyboard behavior, builds the CLI and regenerates the workflow gallery. Commit the generated gallery if its presentation changes. `npm run baseline` is an explicit local measurement; do not regenerate host data in CI.

Do not commit personal catalogues, media, cookies, credentials, private URLs, generated dependencies or machine configuration. New adapters must have meaningful tests for their effect boundaries; neither a screenshot nor a fixture success proves a real download or safe filesystem write.

Original application changes are MIT. Credit inspiration and record copied/reused components, exact upstream revisions, licenses and retained notices in the provenance register. No upstream application code or assets are currently copied.
