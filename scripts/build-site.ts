/**
 * Builds the preview website from content/ as plain static HTML.
 *
 *   npm run build:site   →  dist/site/
 *
 * Deliberately small: no framework, no client state, one CSS file and a few
 * lines of script for search. It shows what exists and nothing more; the full
 * site (ROADMAP phase 1) grows from here once there is content to fill it.
 */
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { marked } from "marked"
import { ROOT, loadEntries, loadSources, type LoadedEntry, type Problem } from "./load.ts"
import type { Source } from "../schema/content.ts"

const OUT = path.join(ROOT, "dist/site")
const REPO = "https://github.com/gronnstudio/GOKH"

const problems: Problem[] = []
const entries = loadEntries(problems)
const sources = loadSources(problems)
if (problems.some((p) => p.level === "error")) {
  console.error("content has errors; run npm run validate first")
  process.exit(1)
}

const byId = new Map(entries.map((e) => [e.data.id, e]))
const sourceByKey = new Map(sources.map((s) => [s.key, s]))

const DOMAIN_LABEL: Record<string, string> = {
  soil: "Soil",
  water: "Water",
  "plants-fungi": "Plants and fungi",
  "animals-biodiversity": "Animals and biodiversity",
  "design-practice": "Design and practice",
  systems: "Systems",
}
const DOMAIN_BLURB: Record<string, string> = {
  soil: "The living ground: structure, life, fertility.",
  water: "Rain, ponds, groundwater and how water moves through a place.",
  "plants-fungi": "What grows, and the fungi that make it possible.",
  "animals-biodiversity": "The life a garden supports, and why variety matters.",
  "design-practice": "What people do on real ground: patterns and techniques.",
  systems: "The ideas underneath: ecology, climate, economics, ethics.",
}
const VERB_OUT: Record<string, string> = {
  "part-of": "is part of",
  needs: "needs",
  enables: "enables",
  improves: "improves",
  harms: "harms",
  "partners-with": "partners with",
  "applies-to": "applies to",
}
const VERB_IN: Record<string, string> = {
  "part-of": "has part",
  needs: "is needed by",
  enables: "is enabled by",
  improves: "is improved by",
  harms: "is harmed by",
  "partners-with": "partners with",
  "applies-to": "draws on",
}
const GRADE_NOTE: Record<string, string> = {
  established: "strong consensus, multiple sources",
  supported: "good evidence, some debate",
  emerging: "early or local evidence",
  contested: "credible sources disagree",
}

const esc = (s: string | number | undefined) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

const title = (e: LoadedEntry) => e.data.title.en || e.data.title.nl
const summary = (e: LoadedEntry) => e.data.summary.en || e.data.summary.nl
const href = (id: string) => `/e/${id}/`

function sourceLine(s: Source) {
  const id = s.doi
    ? `<a href="https://doi.org/${esc(s.doi)}">doi:${esc(s.doi)}</a>`
    : s.isbn
      ? `ISBN ${esc(s.isbn)}`
      : s.url
        ? `<a href="${esc(s.url)}">${esc(s.url)}</a>`
        : ""
  const badge = s.verified
    ? `<span class="chip chip-ok" title="Identifier checked against a registry">verified</span>`
    : `<span class="chip chip-warn" title="No checked identifier yet: help resolve it">unverified</span>`
  return `${esc(s.authors)} (${s.year}). <em>${esc(s.title)}</em>${s.container ? `. ${esc(s.container)}` : ""}. ${id} ${badge}`
}

function page(opts: { title: string; description: string; body: string; path: string }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}">
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Montserrat:wght@400;500;600&family=Syne:wght@600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="bar">
  <a class="brand" href="/">Equilibrium</a>
  <nav aria-label="Main">
    <a href="/"${opts.path === "/" ? ' aria-current="page"' : ""}>Entries</a>
    <a href="/sources/"${opts.path === "/sources/" ? ' aria-current="page"' : ""}>Sources</a>
    <a href="/contribute/"${opts.path === "/contribute/" ? ' aria-current="page"' : ""}>Contribute</a>
  </nav>
</header>
<p class="preview">Preview. Every entry is a draft; Dutch text is on its way.</p>
<main id="main">
${opts.body}
</main>
<footer class="foot">
  <p>Content <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> · code MIT · stewarded by <a href="https://gronn.studio">GRØNN Studio</a> · <a href="${REPO}">source on GitHub</a></p>
</footer>
</body>
</html>
`
}

function card(e: LoadedEntry) {
  const n = e.data.relations.length
  return `<li class="card" data-search="${esc([title(e), summary(e), e.data.tags.join(" "), DOMAIN_LABEL[e.data.domain]].join(" ").toLowerCase())}">
  <a href="${href(e.data.id)}">
    <span class="label">${esc(DOMAIN_LABEL[e.data.domain])} · ${esc(e.data.type)}</span>
    <span class="card-title">${esc(title(e))}</span>
    <span class="card-text">${esc(summary(e))}</span>
    <span class="label">${n} connection${n === 1 ? "" : "s"} · ${e.data.sources.length} source${e.data.sources.length === 1 ? "" : "s"}</span>
  </a>
</li>`
}

// --- home
const domains = Object.keys(DOMAIN_LABEL)
const relationCount = entries.reduce((n, e) => n + e.data.relations.length, 0)
const verifiedCount = sources.filter((s) => s.verified).length
const home = page({
  title: "Equilibrium: designing with living systems",
  description: "An open, evidence-graded knowledge hub for ponds, water, soil and native plants in the Low Countries.",
  path: "/",
  body: `<section class="hero">
  <h1>Designing with living systems</h1>
  <p class="lead">An open reference for the Low Countries: why things work, how sure we are, and what connects to what. Every connection says why it holds; every source can be checked.</p>
  <p class="label">${entries.length} entries · ${relationCount} connections · ${sources.length} sources, ${verifiedCount} verified</p>
  <label class="search">
    <span class="sr-only">Search entries</span>
    <input id="q" type="search" placeholder="Search: soil, water, fungi, succession…" autocomplete="off">
  </label>
</section>
${domains
  .map((d) => {
    const list = entries.filter((e) => e.data.domain === d)
    if (!list.length) return ""
    return `<section class="domain" data-domain>
  <h2>${esc(DOMAIN_LABEL[d])} <span class="count">${list.length}</span></h2>
  <p class="muted">${esc(DOMAIN_BLURB[d])}</p>
  <ul class="cards">${list.map(card).join("\n")}</ul>
</section>`
  })
  .join("\n")}
<p id="none" class="muted" hidden>Nothing matches yet. <a href="/contribute/">Suggest it.</a></p>
<script>
const q = document.getElementById('q'), none = document.getElementById('none');
q.addEventListener('input', () => {
  const t = q.value.trim().toLowerCase(); let shown = 0;
  document.querySelectorAll('[data-domain]').forEach(sec => {
    let n = 0;
    sec.querySelectorAll('.card').forEach(c => { const hit = !t || c.dataset.search.includes(t); c.hidden = !hit; if (hit) n++; });
    sec.hidden = n === 0; shown += n;
  });
  none.hidden = shown > 0;
});
</script>`,
})

// --- entry pages
const inbound = new Map<string, { from: LoadedEntry; verb: string; why: string; grade: string }[]>()
for (const e of entries)
  for (const r of e.data.relations) {
    const list = inbound.get(r.to) ?? []
    list.push({ from: e, verb: r.verb, why: r.why.en || r.why.nl, grade: r.grade })
    inbound.set(r.to, list)
  }

function entryPage(e: LoadedEntry) {
  const out = e.data.relations
    .map((r) => {
      const t = byId.get(r.to)!
      return `<li class="rel">
  <p><span class="verb">${esc(VERB_OUT[r.verb])}</span> <a href="${href(t.data.id)}">${esc(title(t))}</a></p>
  <p>${esc(r.why.en || r.why.nl)}</p>
  <p class="label"><span class="chip chip-${r.grade}" title="${esc(GRADE_NOTE[r.grade])}">${esc(r.grade)}</span>${r.review ? ` <span class="chip chip-warn" title="Remapped from an earlier verb; a person still has to check it">verb not yet reviewed</span>` : ""}</p>
</li>`
    })
    .join("\n")
  const inc = (inbound.get(e.data.id) ?? [])
    .map(
      (r) => `<li class="rel">
  <p><span class="verb">${esc(VERB_IN[r.verb])}</span> <a href="${href(r.from.data.id)}">${esc(title(r.from))}</a></p>
  <p>${esc(r.why)}</p>
  <p class="label"><span class="chip chip-${r.grade}" title="${esc(GRADE_NOTE[r.grade])}">${esc(r.grade)}</span></p>
</li>`,
    )
    .join("\n")
  const srcs = e.data.sources.map((k) => sourceByKey.get(k)).filter((s): s is Source => Boolean(s))
  const body = e.body.en || e.body.nl
  return page({
    title: `${title(e)} · Equilibrium`,
    description: summary(e),
    path: href(e.data.id),
    body: `<article class="entry">
  <p class="label"><a href="/">Entries</a> / ${esc(DOMAIN_LABEL[e.data.domain])}</p>
  <h1>${esc(title(e))}</h1>
  <p class="lead">${esc(summary(e))}</p>
  <p class="label"><span class="chip chip-warn" title="Not yet reviewed by the steward">${esc(e.data.status)}</span> ${e.data.level ? `· ${esc(e.data.level)}` : ""} · updated ${esc(e.data.updated)} · <a href="${REPO}/blob/main/content/entries/${esc(e.file)}">edit this page</a></p>
  <div class="prose">${marked.parse(body) as string}</div>
  ${out ? `<section><h2>Connections</h2><ul class="rels">${out}</ul></section>` : ""}
  ${inc ? `<section><h2>Connected from</h2><ul class="rels">${inc}</ul></section>` : ""}
  ${srcs.length ? `<section><h2>Sources</h2><ol class="srcs">${srcs.map((s) => `<li>${sourceLine(s)}</li>`).join("\n")}</ol></section>` : ""}
</article>`,
  })
}

// --- sources page
const citedBy = new Map<string, LoadedEntry[]>()
for (const e of entries) for (const k of e.data.sources) citedBy.set(k, [...(citedBy.get(k) ?? []), e])
const sortedSources = [...sources].sort((a, b) => Number(a.verified) - Number(b.verified) || a.authors.localeCompare(b.authors))
const sourcesPage = page({
  title: "Sources · Equilibrium",
  description: "Every source Equilibrium cites, and which ones are verified.",
  path: "/sources/",
  body: `<h1>Sources</h1>
<p class="lead">${sources.length} sources, ${verifiedCount} verified. An unverified source has no checked DOI, ISBN or link yet. Resolving one is the most useful first contribution.</p>
<ol class="srcs">${sortedSources
    .map((s) => {
      const by = citedBy.get(s.key) ?? []
      return `<li>${sourceLine(s)}<br><span class="label">cited by ${by.map((e) => `<a href="${href(e.data.id)}">${esc(title(e))}</a>`).join(", ") || "no entry yet"}</span></li>`
    })
    .join("\n")}</ol>`,
})

// --- contribute page
const contributePage = page({
  title: "Contribute · Equilibrium",
  description: "How knowledge gets into Equilibrium.",
  path: "/contribute/",
  body: `<h1>Contribute</h1>
<p class="lead">Anyone can propose a change. A steward decides what is merged. Everything published is free to reuse under CC BY-SA 4.0.</p>
<div class="prose">
<h2>Three ways in</h2>
<ol>
<li><strong>Edit an entry.</strong> Every page has an "edit this page" link to its file on GitHub.</li>
<li><strong>Suggest something.</strong> <a href="${REPO}/issues/new">Open an issue</a>: what is missing or wrong, and where you know it from. No GitHub account? Email <a href="mailto:hello@gronn.studio">hello@gronn.studio</a>.</li>
<li><strong>Resolve a source.</strong> Pick an <a href="/sources/">unverified source</a>, find its DOI or ISBN, check it, and add it.</li>
</ol>
<h2>The rules</h2>
<ul>
<li>Nothing invented: no made-up people, numbers, sources or results.</li>
<li>Your own words: facts can come from anywhere; text cannot.</li>
<li>Every connection says why it holds, and how sure we are.</li>
<li>No bylines: your credit is the history of the project.</li>
</ul>
<h2>How sure are we?</h2>
<ul>${Object.entries(GRADE_NOTE).map(([g, n]) => `<li><span class="chip chip-${g}">${g}</span> ${esc(n)}</li>`).join("")}</ul>
<p>Read the full guide in <a href="${REPO}/blob/main/CONTRIBUTING.md">CONTRIBUTING.md</a>.</p>
</div>`,
})

// --- write
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
writeFileSync(path.join(OUT, "index.html"), home)
for (const e of entries) {
  mkdirSync(path.join(OUT, "e", e.data.id), { recursive: true })
  writeFileSync(path.join(OUT, "e", e.data.id, "index.html"), entryPage(e))
}
for (const [dir, html] of [["sources", sourcesPage], ["contribute", contributePage]] as const) {
  mkdirSync(path.join(OUT, dir), { recursive: true })
  writeFileSync(path.join(OUT, dir, "index.html"), html)
}
cpSync(path.join(ROOT, "site/styles.css"), path.join(OUT, "styles.css"))
writeFileSync(
  path.join(OUT, "404.html"),
  page({ title: "Not found · Equilibrium", description: "", path: "", body: `<h1>Nothing here yet</h1><p class="lead">This page doesn't exist. <a href="/">Back to the entries</a>, or <a href="/contribute/">suggest what should be here</a>.</p>` }),
)
console.log(`built ${entries.length + 4} pages to dist/site/`)
