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
- [x] Static preview site on Vercel (`npm run build:site`)
- [ ] Design research (owner, 3 Oct 2026): study open-source projects' and NGOs' websites, then decide a future-proof stack and look for the phase 1 site. Record the decision in `docs/decisions/` with the sites studied and why.

## Deferred, and what brings each back

| Feature | Comes back when |
| --- | --- |
| Accounts, saved lists, progress | Readers ask for it repeatedly and a route has more than 10 steps |
| Comments or discussion | More than a handful of issues a month need back-and-forth |
| Database | Content is written at volume by people who can't use Git |
| Ask-the-hub AI | 80% of claims have a verified source |
| More languages | A native speaker volunteers to maintain one |
| Membership or premium | Never; partners fund growth and upkeep instead |
