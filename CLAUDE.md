# Equilibrium — working memory

The open, evidence-graded knowledge hub for designing with living systems in the Low Countries, stewarded by GRØNN Studio. This repo is v2 (October 2026): a clean rebuild around the content, after three earlier attempts (G-eog, OKH/TERRA, the equilibrium vision site) spent their effort on interface.

## Standing decisions (owner, 3 Oct 2026 — do not relitigate)

- **Low Countries first**, built so it can grow wider later.
- **New, clean repo.** G-eog, OKH and the equilibrium vision site are archived after migration.
- **No authors.** Entries have no author field and no byline. The schema rejects one. Credit is Git history and a contributors page.
- **Kennisbank on gronn.studio links here** for the why; this hub credits GRØNN as steward.
- **No membership or premium.** Partners who help the hub grow and stay maintained are welcome; they never buy content, placement, grades or verification.
- **One-year plan**, Oct 2026 – Oct 2027, in gated phases (ROADMAP.md).

## Owner decisions, 4 Oct 2026 (docs/decisions/0003)

- **Dutch only for now.** The site publishes Dutch; more languages once the Dutch audience is reached. Keep `en` in the schema and interface text so adding a language stays a one-line change (`LANGS` in site/src/lib/i18n.ts).
- **Wider scope:** self-reliance, vegetable gardening, seed saving, bread baking, fermenting: the domain `food-self-reliance` ("Voedsel en zelfredzaamheid").
- **Free knowledge, beyond Wikipedia:** graded claims, explained relations, practical and local, open data, every change visible. Built to change with the times.

## Principles

1. Content before chrome: no page or feature before the content it shows exists.
2. Files are the database: `content/` is the only source of truth.
3. Nothing invented: no made-up people, numbers, sources or results. Unverified stays visibly unverified.
4. Every relation has a verb, a reason, a grade and ideally a source.
5. Dutch first: the content and the site are Dutch for now; other languages follow (owner, 4 Oct 2026).
6. Boring and maintainable: no database, accounts or paid services until a trigger in ROADMAP.md fires.
7. Docs describe what exists. Plans live in ROADMAP.md only.

## Where things are

- **Live preview:** https://gokh-indol.vercel.app (Vercel project `gokh`, team "gronn"; push to `main` deploys). Vercel Authentication is on for every `.vercel.app` URL, the team default; whether production goes public is the owner's call.
- **Site stack:** Astro (static, pinned), Pagefind, plain modern CSS (no Tailwind, owner 4 Oct 2026); it reads content through `scripts/load.ts`. Colours, type and motion live in `design/tokens.json` (`npm run tokens` regenerates the CSS). Why: `docs/decisions/0001` and `0002`. Before pushing site changes: `npm run check && npm run build && npm run budget && npm run test:site`.
- **Concept and decisions:** the owner's project doc "Equilibrium v2 — Concept & Architecture" on claude.ai (tabs: the plan, Source register of 99 outside sources with licences, NotebookLM pull list — the last one parked by the owner).
- **Material still to migrate, in the owner's private repos** (read them, never copy client material into this public repo):
  - `gronnstudio/G-eog` `src/lib/knowledge/`: diagnose.ts (12 problems), paths.ts (4), collections.ts (3), seasonal.ts (48 tasks), partners.ts (Grnfix).
  - `gronnstudio/equilibrium` `src/lib/`: archive.ts (119 plant profiles), patterns.ts (25), practices.ts (8), calendar.ts; docs/data/candidate-plants.csv (749 names; names only, the attribute data has database rights) and docs/CURATION.md (the curation workflow).
  - `gronnstudio/gronn-studio` `src/lib/data/`: kennis.ts, kennis-blogs.ts, zelf-doen.ts, seizoen.ts (Nick's own words — the strongest voice). Case studies vijverrenovatie.ts and terras-geulle.ts need the client's written permission first.
  - `gronnstudio/OKH` duplicates G-eog's content exactly; nothing to take.
- **Source licences:** reuse (CC0/CC BY/CC BY-SA) e.g. Wikidata, GBIF (not NC datasets), GloBI, NVWA text, KNMI, Klimaateffectatlas, PDOK, Appropedia, PFAF text (not images). Cite-only: STOWA, FLORON, RAVON, Vlinderstichting, Louis Bolk, food-forest networks, anything NC.

## House rules

- A wrong identifier is worse than none. `verified: true` only after a DOI/ISBN/URL was checked; the resolver needs Crossref and OpenAlex to agree before it sets it, and never sets it for books.
- Never paste text from a source whose licence isn't CC0, CC BY or CC BY-SA. Facts in our own words, with a citation.
- Migrated relations keep `was:` (their G-eog verb) and `review: true` until a person checks them. A reviewed entry can't carry an unreviewed relation (the validator enforces it).
- Client projects become field cases only with the client's written permission. Never commit client material without it.
- Verify before pushing: `npm run check`.
