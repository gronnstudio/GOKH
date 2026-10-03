/**
 * Finds identifiers for unverified sources, using open registries only.
 *
 *   npm run resolve              write a report to dist/resolution-report.json, change nothing
 *   npm run resolve -- --write   also add what was found to content/sources.yaml
 *
 * Rules (a wrong identifier is worse than none):
 * - Papers and reports: a Crossref match is accepted only when the title is a near-exact match,
 *   the year agrees and the first author's surname agrees. It then has to be found again,
 *   independently, in OpenAlex with the same title. Only then is it written with `verified: true`.
 * - Books: Open Library is searched by title and author. An ISBN is written as a candidate with
 *   `verified: false`, because the edition a writer used can't be known automatically.
 *   A person confirms the edition and flips `verified`.
 * - Everything else is listed in the report for a person to resolve.
 *
 * Needs network access to api.crossref.org, api.openalex.org and openlibrary.org,
 * so it runs in CI (the "Resolve sources" workflow) or on your own machine.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import YAML from "yaml"
import { ROOT, SOURCES_FILE, loadSources, type Problem } from "./load.ts"
import type { Source } from "../schema/content.ts"

const MAILTO = process.env.RESOLVER_MAILTO ?? "hello@gronn.studio"
const UA = `Equilibrium source resolver (mailto:${MAILTO})`
const WRITE = process.argv.includes("--write")

const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim()

/** Share of the shorter title's words that appear in the other, in order-insensitive form. */
function titleMatch(a: string, b: string): number {
  const wa = norm(a).split(" "), wb = new Set(norm(b).split(" "))
  const hits = wa.filter((w) => wb.has(w)).length
  return hits / Math.max(wa.length, wb.size)
}

const firstSurname = (authors: string) => norm(authors.split(/[,&]| et al/)[0]).split(" ")[0]

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Outcome =
  | { key: string; result: "verified-doi"; doi: string; crossrefTitle: string; openalexId: string }
  | { key: string; result: "isbn-candidate"; isbn: string; olTitle: string; olYear?: number }
  | { key: string; result: "needs-person"; reason: string; best?: string }

async function resolvePaper(s: Source): Promise<Outcome> {
  const q = encodeURIComponent(`${s.title} ${s.authors} ${s.year}`)
  const cr = await getJson(`https://api.crossref.org/works?query.bibliographic=${q}&rows=3&mailto=${MAILTO}`)
  for (const item of cr.message?.items ?? []) {
    const title = item.title?.[0] ?? ""
    const year = item.issued?.["date-parts"]?.[0]?.[0]
    const surname = norm(item.author?.[0]?.family ?? "")
    if (titleMatch(s.title, title) < 0.9) continue
    if (year !== s.year) continue
    if (surname !== firstSurname(s.authors)) continue
    // second, independent match
    const doi = String(item.DOI).toLowerCase()
    try {
      const oa = await getJson(`https://api.openalex.org/works/doi:${doi}?mailto=${MAILTO}`)
      if (titleMatch(s.title, oa.title ?? "") >= 0.9) return { key: s.key, result: "verified-doi", doi, crossrefTitle: title, openalexId: oa.id }
      return { key: s.key, result: "needs-person", reason: "Crossref and OpenAlex disagree on the title", best: doi }
    } catch {
      return { key: s.key, result: "needs-person", reason: "Crossref match not found in OpenAlex", best: doi }
    }
  }
  return { key: s.key, result: "needs-person", reason: "no Crossref match with the same title, year and first author" }
}

async function resolveBook(s: Source): Promise<Outcome> {
  const q = `title=${encodeURIComponent(s.title)}&author=${encodeURIComponent(firstSurname(s.authors))}&limit=5`
  const ol = await getJson(`https://openlibrary.org/search.json?${q}&fields=title,first_publish_year,isbn,author_name`)
  for (const d of ol.docs ?? []) {
    if (titleMatch(s.title, d.title ?? "") < 0.8) continue
    const isbn = (d.isbn ?? []).find((i: string) => /^97[89]\d{10}$/.test(i)) ?? (d.isbn ?? [])[0]
    if (isbn) return { key: s.key, result: "isbn-candidate", isbn, olTitle: d.title, olYear: d.first_publish_year }
  }
  return { key: s.key, result: "needs-person", reason: "no Open Library match with this title and author" }
}

const problems: Problem[] = []
const sources = loadSources(problems)
if (problems.length) {
  console.error("sources.yaml has errors; run npm run validate first")
  process.exit(1)
}

const todo = sources.filter((s) => !s.verified && !s.doi && !s.isbn)
console.log(`${todo.length} unverified sources to try`)
const outcomes: Outcome[] = []
for (const s of todo) {
  try {
    outcomes.push(s.type === "book" ? await resolveBook(s) : await resolvePaper(s))
  } catch (e) {
    outcomes.push({ key: s.key, result: "needs-person", reason: `lookup failed: ${(e as Error).message}` })
  }
  await pause(300) // stay well inside the registries' polite limits
}

mkdirSync(path.join(ROOT, "dist"), { recursive: true })
writeFileSync(path.join(ROOT, "dist/resolution-report.json"), JSON.stringify(outcomes, null, 2))
const count = (r: Outcome["result"]) => outcomes.filter((o) => o.result === r).length
console.log(`verified DOIs: ${count("verified-doi")} · ISBN candidates: ${count("isbn-candidate")} · for a person: ${count("needs-person")}`)

if (WRITE) {
  const raw = YAML.parse(readFileSync(SOURCES_FILE, "utf8")) as Record<string, unknown>[]
  for (const o of outcomes) {
    const row = raw.find((r) => r.key === o.key)
    if (!row) continue
    if (o.result === "verified-doi") Object.assign(row, { doi: o.doi, verified: true })
    if (o.result === "isbn-candidate") Object.assign(row, { isbn: o.isbn, verified: false })
  }
  const header = readFileSync(SOURCES_FILE, "utf8").split("\n").filter((l) => l.startsWith("#")).join("\n")
  writeFileSync(SOURCES_FILE, `${header}\n${YAML.stringify(raw, { lineWidth: 100 })}`)
  console.log("sources.yaml updated; review the diff before merging")
}
