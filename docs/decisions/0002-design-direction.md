# 0002 · Design direction: modern by the platform, not by libraries

- **Status:** proposed (4 Oct 2026). The owner accepts it by merging the pull request that adds it. The steps and their gates live in [ROADMAP.md](../../ROADMAP.md#site-plan).
- **Builds on:** [0001 · The site stack](0001-site-stack.md).
- **Answers:** the owner's ask on 4 Oct 2026 for "a future-proof site with a very modern tech stack and look".

## The idea

The most modern thing a site can do in 2026 is let the browser do the work. View transitions, scroll-driven animation, anchor-positioned popovers, container queries, OKLCH colour and `light-dark()` are now built into browsers. Five years ago each of these needed a library. Interop 2026, the joint work plan of Apple, Google, Microsoft and Mozilla, includes view transitions, scroll-driven animations and anchor positioning ([WebKit announcement](https://webkit.org/blog/17818/announcing-interop-2026/)). That means they are converging in every engine.

So we take two positions at once:

- **Modern:** we use these platform features as soon as they ship anywhere.
- **Future-proof:** we use them only as progressive enhancement. A browser that lacks a feature still gets the full, plain page. No library sits between us and the platform that we would have to migrate away from in 2030.

The earlier hub attempts spent their effort on interface: WebGL heroes, GSAP, Lenis and auth. This direction puts the effort into one thing no other site has, **evidence you can see**.

## The look

**Calm, editorial and botanical, with the evidence as the ornament.** It stays inside the GRØNN Brand Guide 2026: aarde-oranje, gebroken wit, antraciet, bosgroen, mosgroen and salie, with Syne, Montserrat and Geist Mono. Rounded-full buttons, 16px cards, 60/30/10 proportions.

1. **Evidence is the visual language.**
   - Every relation shows its grade as a glyph (four filled steps for established, fewer for supported and emerging, a split mark for contested), not only as a word.
   - A verified source wears a seal. An unverified one has a dashed outline and a "help resolve" affordance.
   - Following Conservation Evidence, the grade can later separate *how big the effect is* from *how sure we are*.
   - This is the honest version of decoration: it carries information.
2. **The knowledge graph is the signature image.**
   - Each entry page gets a small constellation of its neighbours: one and two hops away, each line in its verb's style and its grade's weight.
   - It is drawn as SVG at build time, with the layout computed once and seeded so it never jumps between builds. The page ships no JavaScript for it.
   - The full interactive graph comes later, as one island (see the roadmap gate).
3. **Type does the heavy lifting.**
   - Syne at display size, about 88px, for page titles. Montserrat variable for reading, with `text-wrap: pretty` and `balance`. Geist Mono for every piece of metadata: grades, dates, counts, identifiers.
   - The hierarchy is legible without colour.
4. **Each domain gets a hue.** Soil, water, plants and fungi, animals, design practice and systems each get a hue derived in OKLCH from the botanical palette. Each is contrast-checked against both themes and used on tiles, graph nodes and chips.
5. **A bento home.** The home page becomes a grid of tiles:
   - "start from a problem" (the 12 problems)
   - the six domains with their counts
   - a "this month" tile, once the seasonal tasks are migrated
   - the latest reviewed entries
   - the graph
   It uses container queries and subgrid, so each tile lays itself out for its own width.
6. **Motion that explains, never decorates.**
   - Navigating from a card to its entry morphs the title with a cross-document view transition, so you see where you came from.
   - Reading progress and section reveals are scroll-driven CSS.
   - Everything sits under `@supports` and `prefers-reduced-motion`.
   - No JavaScript animation library.
7. **Light "Golden Hour" and dark "Blauwe Uur"** both come from one token set through `light-dark()`. A small toggle overrides the system setting, with no flash on load.
8. **Images only with a licence.**
   - No stock photos and no placeholders: a missing image stays missing.
   - CC0, CC BY and CC BY-SA images (Wikimedia Commons, GBIF media without NC) are stored with their attribution in `content/` and served as AVIF through Astro's image pipeline.

## The stack additions

All of these are build-time or platform features. None is a runtime service.

| Layer | Addition | Why it lasts |
| --- | --- | --- |
| Tokens | One `design/tokens.json` in the W3C Design Tokens format 2025.10 (DTCG), with colours in OKLCH, generating the CSS custom properties | It is the first stable, vendor-neutral token format ([announcement](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)). Figma, Penpot and code read the same file, and the contrast audit reads it too. |
| CSS | Native CSS only:<br>- `@layer` (reset, tokens, base, components, utilities)<br>- nesting and `@scope`<br>- container queries and `:has()`<br>- `light-dark()`, `color-mix()` and `@property`<br>Lightning CSS (through Vite) minifies and lowers syntax for older browsers. | Nothing to upgrade. The browser is the framework. |
| Browser floor | Browserslist `baseline widely available` drives Lightning CSS. Stylelint with `stylelint-plugin-use-baseline` flags any newer feature used outside `@supports` ([web.dev](https://web.dev/articles/use-baseline-with-browserslist)). | We use new features on purpose, never by accident. |
| Navigation | Native cross-document view transitions (`@view-transition { navigation: auto }`), not Astro's client router. Speculation Rules prerender a link on hover. Chromium acts on that; other browsers ignore it ([Chrome docs](https://developer.chrome.com/docs/web-platform/prerender-pages)). | It stays a multi-page site: no client router to maintain, and every page works without JavaScript. Astro's own docs expect the client router to become unnecessary as browsers catch up ([Astro docs](https://docs.astro.build/en/guides/view-transitions/)). |
| UI primitives | Native `popover` with anchor positioning for grade explanations, glossary terms and citation previews. `<dialog>` for the command palette and the shortcut sheet. | Anchor positioning reached Baseline in January 2026. No floating-UI or modal library. |
| Search and keys | A command palette ported from gronn-studio's: ⌘K / Ctrl K, prefix-then-substring ranking grouped by kind, a keyboard cursor, recent picks kept on the device. Pagefind adds full-text hits, loaded only once someone types. Shortcuts: `/` search, `?` the shortcut sheet, `g h` / `g s` / `g c` go to, `t` theme, `l` language, `j` / `k` walk cards and connections. Single-key shortcuts can be switched off (WCAG 2.1.4). | One small web-standard script (about 3 KB gzipped) instead of Pagefind's 39 KB UI on every page. The search index is a static JSON file per language. |
| Graph | Neighbourhood layout computed at build with `d3-force` (a dev dependency only) and written out as static SVG | Zero runtime cost. The data comes from the same `scripts/load.ts`. |
| Social cards | One OG image per entry, rendered at build with Satori and resvg in the brand type | Static files, so they work on any host |
| Islands (phase 2) | Small web components or Astro `<script>` modules for the diagnose flow. A MapLibre island with PDOK tiles for the map. One graph-explorer island. React only if a piece truly needs it. | Web components are the longest-lived component model there is. |
| Offline (phase 2) | A small service worker that caches read pages, for people reading in the garden with no signal | It is a plain web standard and optional |

## The guardrails

What keeps it future-proof once it is built:

- **Budgets, enforced in CI** (adapted from paddenstoelenbos):
  - our own JavaScript is at most 6 KB gzipped per page (today the theme switch, palette and shortcuts: 3.2 KB)
  - no page ships more than 50 KB gzipped JavaScript in total, including search
  - CSS is at most 30 KB gzipped
  - LCP is under 1.5 s on a mid-range phone
- **Contrast audit from the tokens file.** Every colour pair is checked in both themes, and the CI fails below AA. The axe gate already caught one such bug: moss-green small text at 4.1:1.
- **Visual regression.** Playwright screenshots of each page template in both themes, on desktop and phone.
- **Accessibility.** The existing axe gate on every page in both languages stays. The target is WCAG 2.2 AA.
- **Dependency updates.** Renovate opens weekly grouped update PRs; Astro majors come as separate PRs, and a major merges only when the gate is green.
- **Exit cost.** Every new piece stays outside `content/` and `schema/`. Leaving Astro still costs one folder.

## What we deliberately do not do

- **No WebGL or three.js, GSAP, Lenis, framer-motion or custom cursors.** They are what the earlier attempts spent their effort on. gronn-studio V5 dropped them too: "small and precise beats big and decorative".
- **No Tailwind.** It is a strong tool, and the studio's other sites use it. But for one stylesheet built on platform features, it adds a build dependency and replaces nothing we lack. The owner chose plain CSS on 4 Oct 2026.
- **No client-side router or SPA.**
- **No AI chat on the page** until the ROADMAP trigger fires (80% of claims have a verified source).

## Open questions for the owner

1. ~~**Styling across sites:** plain modern CSS or Tailwind v4?~~ **Answered (owner, 4 Oct 2026): plain CSS.**
2. **The grade glyph:** four steps on one axis (today's grades), or two axes (effect × certainty) like Conservation Evidence? Two axes would need a schema change.
3. **Domain hues:** derived from the botanical palette as proposed, or should GRØNN's brand guide fix six colours?
