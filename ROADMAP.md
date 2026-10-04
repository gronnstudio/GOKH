# Roadmap

One year, October 2026 to October 2027, in four phases. Each phase opens when the one before passes its gate; the dates are proposals, the gates are the commitment. The full reasoning is in the project document "Equilibrium v2 — Concept & Architecture".

| Phase | Proposed dates | Ships | Gate to the next phase |
| --- | --- | --- | --- |
| 0 · Seed | Oct–Dec 2026 | This repository, the schema and checks, the 31 G-eog articles migrated without author names | 50 entries reviewed; every source verified or flagged |
| 1 · Open | Jan–Apr 2027 | Five public pages, plant profiles migrated, first dataset release, Kennisbank links | 150 entries; 3 outside contributors merged |
| 2 · Connect | May–Aug 2027 | Diagnose, routes, map; patterns and field cases | 300 explained relations; 5 routes complete |
| 3 · Commons | Sep–Oct 2027 | First upkeep partners, AI-assisted curation, year-one review | Review published on the hub |

## Phase 0 checklist

- [x] Repository, schema, validator, export, CI
- [x] 31 G-eog articles migrated as drafts, contributor names removed
- [x] 97 relations remapped to 7 verbs; 49 marked for review
- [x] 80 sources moved; 6 verified
- [x] Run the source resolver (Actions → Resolve sources) and review its pull request
- [ ] Review the 49 remapped relations
- [ ] Dutch title, summary and text for the first entries
- [ ] Give nutrient-cycling, photosynthesis, forest-microclimates and regenerative-grazing a second relation
- [x] Migrate the 12 diagnose problems as draft `problem` entries (reading list only; no relations invented)
- [ ] Migrate the 4 paths and 3 collections
- [ ] Reach 50 reviewed entries
- [x] Static preview site on Vercel (`npm run build:site`), in Dutch and English, with search and an accessibility gate in CI
- [x] Design direction proposed in `docs/decisions/0002-design-direction.md`; steps under Site plan below
- [x] Design research: every gronnstudio repo and 15 open-source and NGO sites studied; stack decided in `docs/decisions/0001-site-stack.md` (Astro, static, Pagefind)

## Site plan

The site's design direction is decision [0002](docs/decisions/0002-design-direction.md): modern through the web platform, every new feature added as progressive enhancement, and the evidence itself as the visual language. Each step opens at its gate, so no feature arrives before the content it shows.

### Step A · Foundation (Phase 0, no new content needed)

- [x] Tokens in `design/tokens.json` (W3C Design Tokens format 2025.10), with colours in OKLCH. A script turns them into CSS custom properties, using `light-dark()`.
- [x] Contrast audit read from the tokens: every colour pair, in both themes, run in CI.
- [x] Rewrite the stylesheet as native CSS: `@layer`, nesting, container queries, `text-wrap`. Lightning CSS with `baseline widely available` targets, and Stylelint with `use-baseline`.
- [x] Cross-document view transitions: the card title morphs into the entry title. Speculation Rules prerender on hover.
- [x] Grade glyph and source seal. Grade explanations open in a native `popover` with anchor positioning.
- [x] Theme toggle (Golden Hour / Blauwe Uur) with no flash on load.
- [x] Command palette on ⌘K / Ctrl K from every page (ported from gronn-studio), with Pagefind full text; keyboard shortcuts with a `?` sheet that can switch single keys off.
- [x] Budgets in CI: at most 6 KB of our own JavaScript, 50 KB in total and 30 KB of CSS per page, all gzipped. Playwright visual-regression screenshots of every template.
- [ ] Make the first screenshot baselines: Actions → Update screenshots, then merge its PR.
- [x] Renovate config: weekly grouped dependency updates, with Astro majors as separate PRs.
- [ ] Install the Renovate GitHub app on the repository (owner).

### Step B · Character (opens at the Phase 0 gate: 50 reviewed entries)

- [ ] Neighbourhood graph per entry: SVG built at build time, with lines styled by verb and weighted by grade.
- [ ] Domain hues in OKLCH, contrast-checked, used on tiles, nodes and chips.
- [ ] Bento home: problems, domains, latest reviewed entries, and the graph.
- [ ] An OG image per entry, built at build time in the brand type.
- [ ] Licensed images only (CC0, CC BY, CC BY-SA), with their attribution stored in `content/`, served as AVIF.
- [ ] "This month" tile, once the 48 seasonal tasks are migrated.

### Step C · Interaction (Phase 2: 300 explained relations)

- [ ] Diagnose flow as one small island (a web component or an Astro script).
- [ ] Routes in the GOV.UK step-by-step pattern.
- [ ] Map island: MapLibre with PDOK tiles; Belgium needs its own base map.
- [ ] Full graph explorer as one island.
- [ ] Offline reading: a service worker that caches read pages.

## Deferred, and what brings each back

| Feature | Comes back when |
| --- | --- |
| Accounts, saved lists, progress | Readers ask for it repeatedly and a route has more than 10 steps |
| Comments or discussion | More than a handful of issues a month need back-and-forth |
| Database | Content is written at volume by people who can't use Git |
| Ask-the-hub AI | 80% of claims have a verified source |
| More languages | A native speaker volunteers to maintain one |
| Membership or premium | Never; partners fund growth and upkeep instead |
