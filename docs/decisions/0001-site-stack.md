# 0001 · The site stack

- **Status:** proposed (3 Oct 2026). The owner accepts it by merging the pull request that adds it.
- **Answers:** ROADMAP Phase 0, "Design research: study open-source projects' and NGOs' websites, then decide a future-proof stack and look for the phase 1 site."

## Decision

The public site is **Astro, static output only**. It is built from `content/`, search comes from **Pagefind**, and the GRØNN brand tokens and fonts are self-hosted. There is no server, database, adapter or account.

| Layer | Choice | Why |
| --- | --- | --- |
| Content | `content/` Markdown plus `schema/content.ts` (Zod), unchanged | The files are the database. The schema and loader are plain TypeScript, so the site reads the same `scripts/load.ts` the validator and the dataset export read. If we change framework, the content does not move. |
| Pages | Astro 7, `output: "static"`, pinned to an exact version | Astro is built for Markdown content sites. Its pages are HTML and ship no JavaScript by default. Its `.astro` files read like JSX, so a studio fluent in Next.js can work in it from day one. |
| Interactive parts | Astro islands, added only when a page needs one | The phase 2 diagnose flow and map become islands on their own pages; React islands are possible if the studio wants its own components. Everything else stays plain HTML. |
| Languages | `/nl/…` and `/en/…` are both generated. `/` sends visitors to Dutch. | Path prefixes need no middleware, so they work on any static host. When an entry has no Dutch text yet, the page says so and shows the English text marked `lang="en"`, instead of hiding the gap. |
| Search | Pagefind 1.5, run after the build | Pagefind indexes the built HTML and keeps a separate index per `lang`. It needs no server and no service, and it works on any host. |
| Styling | One plain CSS file with the GRØNN Brand Guide 2026 tokens; Syne, Montserrat and Geist Mono self-hosted through Fontsource | No Tailwind and no CSS build step. One file holds every token and every rule for a small site, and it will still work in ten years. |
| Quality gate | `npm run check` (typecheck, `astro check`, content validation) and `npm run test:site` (Playwright with axe on every page, in both languages, on desktop and phone) | The studio's BUILD-LOG lesson: "zonder deze poort komen ze terug" (without this gate, the bugs come back). The target is WCAG 2.2 AA, ahead of the Dutch public-sector requirement (EN 301 549 / WCAG 2.1 AA). |
| Hosting | Vercel today, configured as a static site (`framework: null`, `outputDirectory: dist/site`) | Any static host serves the same folder: GitHub Pages, Netlify, Cloudflare or an NGO's own server. |

## What we studied

### Our own repositories (all of `gronnstudio`, read on 3 Oct 2026)

Nearly every studio site runs Next.js 16, React 19, Tailwind 4 and TypeScript on Vercel. What they taught us:

- **The earlier hub attempts spent their effort on interface.**
  - *equilibrium* was a "cinematic 3D scroll website" built on R3F, GSAP and Lenis, with about 20 API routes, auth, Stripe and Redis. Its content stayed English while its chrome came in ten languages.
  - *G-eog* planned Postgres, Supabase Auth and a RAG layer, yet its content lived in TS files.
  - *OKH* duplicated G-eog.
  - We take none of that machinery.
  - We keep G-eog's house rules:
    - "never fake backend features"
    - "a wrong link is worse than none"
    - test on a real phone tap
- **gronn-studio (V5) is the brand reference.**
  - We take its tokens from `src/app/globals.css` (Brand Guide 2026: aarde-oranje `#DB6923`, gebroken wit `#EFEEEA`, antraciet `#202020`, bosgroen, mosgroen, salie), and its rule that an orange fill carries antraciet text and orange text on light ground is `#A14312`.
  - We take its type: Syne SemiBold headings, Montserrat body, Geist Mono annotations, fluid sizes with px limits.
  - We take its rounded-full buttons and 16px cards.
  - We take its lessons: V5 started over "van scratch" and dropped Lenis, the terrain choreography and the easter eggs. Its rules are "no new creative/animation libraries" and "small and precise beats big and decorative".
- **paddenstoelenbos taught the quality gate and a warning.**
  - Its gate: Playwright with axe on every route in both languages, a contrast audit and a JS budget.
  - Its warning: a Next 16 `proxy.ts` was never registered, so Vercel served a 404 homepage under `[locale]`. A static site with path prefixes cannot have that failure.
- **gronn-studio's AGENTS.md** names client-side `useT()` translation as the cause of full-tree hydration. Static per-language pages avoid it entirely.

### Open-source projects and NGOs

| Site | Built with | What we take | What we leave |
| --- | --- | --- | --- |
| [MDN](https://developer.mozilla.org) | Markdown in Git ([mdn/content](https://github.com/mdn/content)), its own Rust build ([rari](https://github.com/mdn/rari)) | Content as Markdown files with frontmatter, changes as pull requests, "edit on GitHub" on every page | A custom build tool, and translations in a second repo that drifts out of sync |
| [Our World in Data](https://ourworldindata.org) | React, TypeScript and Vite, with a MySQL-backed static "baker" ([owid-grapher](https://github.com/owid/owid-grapher)) | Sources and method shown beside every claim, a download next to every visual, CC BY throughout | A database and an admin pipeline. Its own README says the tools are "tightly coupled with our database structure". |
| [Examine](https://examine.com) | Astro on Vercel (from its HTML markers and headers) | Proof that a large evidence-graded reference site runs well on this stack | |
| [Conservation Evidence](https://conservationevidence.com) | Not confirmed (bot challenge) | Grades that separate how big an effect is from how sure we are ([categories](https://conservationevidence.com/content/page/79)); its books are CC BY | |
| [Wikidata](https://www.wikidata.org) | MediaWiki | Every statement has a reference and a rank, the same idea as our relation's verb, reason, grade and source | Running a wiki engine |
| [GBIF](https://www.gbif.org) | React and GraphQL over a public API ([gbif-web](https://github.com/gbif/gbif-web)) | A licence badge, a DOI and a "cite this" block on each dataset | API servers |
| [iNaturalist](https://www.inaturalist.org) | Rails | "Research grade" as a visible quality label | Accounts and a database |
| [Python docs](https://docs.python.org), [Rust Book](https://doc.rust-lang.org/book/) | Sphinx, mdBook | Proof that static documentation lasts more than ten years on any host | Generic templating |
| [Natuurmonumenten](https://www.natuurmonumenten.nl) | Next.js | Clean Dutch voice | A heavy JavaScript payload for mostly static pages |
| Vlinderstichting, RAVON, FLORON | WordPress / Elementor / DotNetNuke | Domain vocabulary (they are cite-only sources for us) | Page-builder CMSs that date fast |
| [NL Design System](https://nldesignsystem.nl), [GOV.UK](https://www.gov.uk) | Docusaurus; static-cached govuk-frontend | Plain language, progressive enhancement, the step-by-step pattern for phase 2 routes, WCAG as the floor | |

## Options we did not take

- **Next.js 16 static export.**
  - The studio knows it best, and staying on one framework has real value.
  - Against it: `output: "export"` drops redirects, rewrites, middleware and image optimisation ([docs](https://nextjs.org/docs/app/guides/static-exports)), and ships the React runtime on every page.
  - It has no Markdown content layer of its own, and static export is a secondary mode for a framework steered by a host.
  - It stays the fallback: because the content and schema are framework-free, moving to it would mean rewriting the pages, not the content.
- **Eleventy.** It is technically lean, but Font Awesome bought it (2024), renamed it "Build Awesome" (Mar 2026) and paused and relaunched its funding campaign. We wait until its governance settles.
- **Hugo.** It is one binary with excellent multilingual support and a long record, but its Go templates are foreign to the studio and it has no Zod.
- **A CMS** (WordPress, Drupal, Sanity, Keystatic). Our contributors edit through Git, and the ROADMAP says a database comes back only when people who can't use Git write at volume.

## Risks and how we hold them

- **Astro moves fast.** It had three major versions between late 2025 and June 2026, and it belongs to Cloudflare since January 2026 ([announcement](https://astro.build/blog/joining-cloudflare/): it stays MIT, keeps every deployment target, and keeps open governance).
  - We pin the exact version and use no adapter or server feature.
  - We keep all content logic in `schema/` and `scripts/`, outside Astro. Leaving Astro costs one folder of pages.
- **Pagefind** is maintained by CloudCannon. If it stops, the dataset export and the static pages are unaffected, and a small JSON index search can replace it.
- **Fonts** come from Fontsource (SIL Open Font License), pinned like everything else.

## What comes later, and what brings it

| Later | Comes when |
| --- | --- |
| React islands | The diagnose flow (phase 2) needs state |
| Map island (MapLibre with the PDOK BRT Achtergrondkaart; Belgium needs its own base map) | Field cases or routes with places exist |
| Dutch URL slugs | The Dutch content is complete enough to deserve them |
| OG images per entry | Production goes public |
