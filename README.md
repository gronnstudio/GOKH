# Equilibrium

**The open reference for designing with living systems in the Low Countries: why things work, how sure we are, and what to do this month.**

Equilibrium is an open knowledge hub on ponds, water, soil, native plants, food forests, vegetable gardens, bread and self-reliance, and the systems that tie them together. It is in Dutch for now; more languages follow ([decision 0003](docs/decisions/0003-dutch-first-wider-scope.md)). Every connection between two ideas says *why* it holds and *how sure* we are. Every claim traces to a source you can check, or is marked unverified. Stewarded by [GRØNN Studio](https://gronn.studio).

## What is in this repository

```
content/
  entries/        one Markdown file per entry: concept, species, technique, problem or field case
  sources.yaml    every source cited, with its DOI, ISBN or URL once verified
site/src/         the public site (Astro, static): pages, layout, one stylesheet with the GRØNN tokens
docs/decisions/   why things are the way they are, one record per decision
design/tokens.json  colours, type, space and motion (W3C Design Tokens format); the CSS is generated from it
tests/            Playwright + axe: every page, desktop and phone
schema/
  content.ts      the rules every entry and source must follow
scripts/
  validate.ts     the checks that run on every pull request
  export.ts       exports the corpus as JSON and CSV
  resolve-sources.ts  looks up DOIs and ISBNs in open registries
  migrate/        one-off scripts that brought earlier material in, kept as a record
.github/workflows/  checks on every PR, a manual source resolver, dataset releases
```

`npm run build:site` turns the content into a static Dutch site (`dist/site/`, under `/nl/…`), with Pagefind search, deployed on Vercel and portable to any static host. It shows what exists and nothing more. The stack and the reasons for it are in [docs/decisions/0001-site-stack.md](docs/decisions/0001-site-stack.md).

## An entry

```markdown
---
id: mycorrhizal-networks
type: concept                 # concept | species | technique | problem | field-case
domain: plants-fungi          # soil | water | plants-fungi | animals-biodiversity | design-practice | systems
title: { en: Mycorrhizal Networks, nl: Mycorrhizanetwerken }
summary: { en: "…", nl: "…" }
status: draft                 # draft | reviewed | verified
relations:
  - to: soil-food-web
    verb: part-of             # part-of | needs | enables | improves | harms | partners-with | applies-to
    why: { en: "…", nl: "…" }
    grade: established        # established | supported | emerging | contested
    sources: [source-key]
sources: [source-key]
updated: 2026-10-03
---

<!-- en -->
(English text, optional for now.)

<!-- nl -->
De Nederlandse tekst.
```

A `problem` entry starts from what a visitor would say ("my soil is compacted") and carries two extra fields: `start`, the entries to read first (a reading list, not a relation), and `terms`, the words people might type for it.

Entries have no author field. An entry is trusted for its sources and its review status, not for who wrote it; the Git history records every contribution.

## Working on it

```sh
npm install
npm run validate              # the content checks; add --warnings to see every gap
npm run check                 # types, content, tokens and contrast, CSS Baseline lint, as CI runs it
npm run export                # dist/equilibrium.json, graph.json and CSVs
npm run resolve               # look up identifiers for unverified sources (needs internet)
npm run dev                   # the site at localhost:4321 (search works only after a build)
npm run build                 # validate, build the site and its search index
npm run test:site             # every built page through Playwright and axe (after a build)
npm run budget                # JavaScript and CSS weight of every built page against its budget
npm run tokens                # regenerate site/src/styles/tokens.css after editing design/tokens.json
```

`npm run validate` prints the current state of the corpus: entries per status, relations still to review, verified sources, and how many entries are complete in Dutch.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The most useful first contribution is resolving an unverified source: find its DOI or ISBN, check it against the publisher, and add it to `content/sources.yaml`.

## Licences

- Content (`content/`) and the exported dataset: [CC BY-SA 4.0](LICENSE-CONTENT.md)
- Code (`schema/`, `scripts/`, `site/`, `tests/`, workflows): [MIT](LICENSE)
