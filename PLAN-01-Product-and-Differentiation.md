# SourceSpool — phase 1: product definition and differentiation

Checked working product name: **SourceSpool**. See [name evidence](docs/research/name-check.md). Inspiration: [Yoinks](https://github.com/pablostanley/yoinks). Prepared 12 October 2026, Asia/Singapore.

Status: executed 12 October 2026. Product decisions and scope are complete; interviews remain explicitly pending under this phase's exit rule. See [product brief](docs/product-brief.md), [stories](docs/user-stories.md), [comparison/provenance](docs/research/comparison-and-provenance.md), [name check](docs/research/name-check.md), and [research assumptions](docs/research/problem-validation.md). The original plan steps below remain as the phase specification.

[1. Product](PLAN-01-Product-and-Differentiation.md) · [2. Design + GitHub](PLAN-02-Design-Architecture-and-GitHub.md) · [3. Build](PLAN-03-Build-and-Improve.md) · [4. Validate + release](PLAN-04-Validation-and-GitHub-Release.md) · [5. Posting kit](PLAN-05-Marketing-and-Maintenance.md)

## Intended result

Keep a small, searchable media collection with its source information and a predictable folder structure.

Primary audience: Creators, researchers, and students who save media they are permitted to keep and later struggle to locate it.

Core job: Save a reference clip, record why it matters, and retrieve it later without searching a crowded Downloads folder.

## Beginning: validate the problem

1. Use the existing [research notes](INSPIRATION-REFERENCE.md) as context, then compare the current upstream README and relevant alternatives before claiming a difference.
2. Observe how three to five potential users perform the job. This is a suggested small research sample, not evidence already collected. Record concrete friction, current tools, and the desired outcome.
3. Ask these focused questions:

- How do you currently find a clip saved a month ago?
- What metadata do you need when citing or reusing a saved item?
- Which naming and folder rules do you repeat manually?

4. Check GitHub and the web for the working name, similar tools, and confusing branding. Choose a distinct name and original visual direction before creating public assets.
5. Pick one complete user journey for the first release. Publish a clear feature boundary in the product brief.

## What we will add or change

The original product's value should be demonstrable in these capabilities:

- A collection catalogue with tags, notes, source URLs, and searchable metadata.
- Duplicate detection across the collection, with an explicit keep-existing or save-another choice.
- Reusable naming and destination templates, plus an exportable collection index.

Improve the underlying experience as well:

- Explain downloader failures in plain language and offer a precise next action.
- Keep keyboard navigation, help text, and terminal restoration consistent across every screen.
- Store a completed catalogue record only after the file exists and its metadata can be verified.

Initial scope boundary: Cloud syncing, multi-user accounts, platform-wide scraping, subscription billing, and playlist handling belong after the initial collection workflow.

## Make the project's relationship to upstream clear

- Default implementation direction: write an original application around the stated job using maintained dependencies where suitable. Decide explicitly if any upstream code will be reused.
- Keep a provenance register: component, source URL/version, inspired/reused/independent status, license, and what was changed. Use accurate wording in the eventual README.
- If reusing MIT-covered source, include the original copyright and permission notices. [MIT license text](https://opensource.org/license/mit)
- Credit Yoinks as inspiration; describe the specific reused components if adaptation becomes the chosen route.
- Create your own screenshots, sample data, interface composition, copy, and product identity. Maintain examples showing the newly built workflow and development decisions.
- Confirm the proposed differences against the latest competing products. A feature plan is not evidence that a feature is unprecedented.

## Outputs and phase completion

Produce a one-page product brief, a prioritised user-story list, a comparison/provenance register, a checked working name, and the first-release scope.

Move to phase 2 when you can show: one defined audience and job; three concrete product differences; one end-to-end first-release journey; and a clear implementation/reuse decision. Any user interviews still pending are labelled as pending, with assumptions recorded.

Owner: the project builder; testers supply problem evidence. Sequence follows completion gates rather than calendar promises.
