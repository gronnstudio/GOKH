# Equilibrium — working memory

The open, evidence-graded knowledge hub for designing with living systems in the Low Countries, stewarded by GRØNN Studio. This repo is v2 (October 2026): a clean rebuild around the content, after three earlier attempts (G-eog, OKH/TERRA, the equilibrium vision site) spent their effort on interface.

## Standing decisions (owner, 3 Oct 2026 — do not relitigate)

- **Low Countries first**, built so it can grow wider later.
- **New, clean repo.** G-eog, OKH and the equilibrium vision site are archived after migration.
- **No authors.** Entries have no author field and no byline. The schema rejects one. Credit is Git history and a contributors page.
- **Kennisbank on gronn.studio links here** for the why; this hub credits GRØNN as steward.
- **No membership or premium.** Partners who help the hub grow and stay maintained are welcome; they never buy content, placement, grades or verification.
- **One-year plan**, Oct 2026 – Oct 2027, in gated phases (ROADMAP.md).

## Principles

1. Content before chrome: no page or feature before the content it shows exists.
2. Files are the database: `content/` is the only source of truth.
3. Nothing invented: no made-up people, numbers, sources or results. Unverified stays visibly unverified.
4. Every relation has a verb, a reason, a grade and ideally a source.
5. Dutch and English for the content itself.
6. Boring and maintainable: no database, accounts or paid services until a trigger in ROADMAP.md fires.
7. Docs describe what exists. Plans live in ROADMAP.md only.

## House rules

- A wrong identifier is worse than none. `verified: true` only after a DOI/ISBN/URL was checked; the resolver needs Crossref and OpenAlex to agree before it sets it, and never sets it for books.
- Never paste text from a source whose licence isn't CC0, CC BY or CC BY-SA. Facts in our own words, with a citation.
- Migrated relations keep `was:` (their G-eog verb) and `review: true` until a person checks them. A reviewed entry can't carry an unreviewed relation (the validator enforces it).
- Client projects become field cases only with the client's written permission. Never commit client material without it.
- Verify before pushing: `npm run check`.
