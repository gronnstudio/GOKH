/**
 * Exports the whole corpus as an open dataset (CC BY-SA 4.0), so the knowledge
 * outlives any website built on it.
 *
 *   npm run export   →  dist/equilibrium.json, dist/graph.json, dist/entries.csv, dist/relations.csv, dist/sources.csv
 *
 * Attached to every tagged release by the release workflow.
 */
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { ROOT, loadEntries, loadSources, type Problem } from "./load.ts"

const problems: Problem[] = []
const entries = loadEntries(problems)
const sources = loadSources(problems)
if (problems.some((p) => p.level === "error")) {
  console.error("content has errors; run npm run validate first")
  process.exit(1)
}

const out = path.join(ROOT, "dist")
mkdirSync(out, { recursive: true })

const meta = {
  name: "Equilibrium",
  licence: "CC BY-SA 4.0",
  steward: "GRØNN Studio",
  exported: new Date().toISOString(),
}

writeFileSync(
  path.join(out, "equilibrium.json"),
  JSON.stringify({ meta, entries: entries.map((e) => ({ ...e.data, body: e.body })), sources }, null, 2),
)

writeFileSync(
  path.join(out, "graph.json"),
  JSON.stringify(
    {
      meta,
      nodes: entries.map(({ data: e }) => ({ id: e.id, type: e.type, domain: e.domain, title: e.title, status: e.status })),
      edges: entries.flatMap(({ data: e }) => e.relations.map((r) => ({ from: e.id, to: r.to, verb: r.verb, grade: r.grade }))),
    },
    null,
    2,
  ),
)

const csv = (rows: (string | number | boolean | undefined)[][]) =>
  rows.map((r) => r.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n") + "\n"

writeFileSync(
  path.join(out, "entries.csv"),
  csv([
    ["id", "type", "domain", "status", "title_en", "title_nl", "summary_en", "summary_nl", "tags", "sources", "updated"],
    ...entries.map(({ data: e }) => [e.id, e.type, e.domain, e.status, e.title.en, e.title.nl, e.summary.en, e.summary.nl, e.tags.join(" "), e.sources.join(" "), e.updated]),
  ]),
)
writeFileSync(
  path.join(out, "relations.csv"),
  csv([
    ["from", "verb", "to", "grade", "why_en", "why_nl", "sources", "reviewed"],
    ...entries.flatMap(({ data: e }) => e.relations.map((r) => [e.id, r.verb, r.to, r.grade, r.why.en, r.why.nl, r.sources.join(" "), !r.review])),
  ]),
)
writeFileSync(
  path.join(out, "sources.csv"),
  csv([
    ["key", "type", "authors", "year", "title", "container", "doi", "isbn", "url", "verified"],
    ...sources.map((s) => [s.key, s.type, s.authors, s.year, s.title, s.container, s.doi, s.isbn, s.url, s.verified]),
  ]),
)

console.log(`exported ${entries.length} entries, ${entries.reduce((n, e) => n + e.data.relations.length, 0)} relations, ${sources.length} sources to dist/`)
