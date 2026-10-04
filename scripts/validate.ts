/**
 * The content checks. Runs on every pull request and before every build.
 * Errors fail the run; warnings are printed and counted, so drafts can land
 * while they are still being completed.
 *
 *   npm run validate            human-readable report
 *   npm run validate -- --json  machine-readable summary (used by the stats in README)
 */
import { loadEntries, loadSources, type Problem } from "./load.ts"

const problems: Problem[] = []
const err = (where: string, message: string) => problems.push({ level: "error", where, message })
const warn = (where: string, message: string) => problems.push({ level: "warning", where, message })

const entries = loadEntries(problems)
const sources = loadSources(problems)

const entryIds = new Map<string, string>()
for (const e of entries) {
  if (`${e.data.id}.md` !== e.file) err(e.file, `id "${e.data.id}" must match the file name`)
  if (entryIds.has(e.data.id)) err(e.file, `id "${e.data.id}" is also used by ${entryIds.get(e.data.id)}`)
  entryIds.set(e.data.id, e.file)
}

const sourceKeys = new Set<string>()
for (const s of sources) {
  if (sourceKeys.has(s.key)) err("sources.yaml", `source key "${s.key}" is used twice`)
  sourceKeys.add(s.key)
}

const inbound = new Map<string, number>()
const citedSources = new Set<string>()

for (const { file, data: e, body } of entries) {
  // relations
  for (const r of e.relations) {
    if (r.to === e.id) err(file, "an entry cannot relate to itself")
    if (!entryIds.has(r.to)) err(file, `relation to "${r.to}" points at no entry`)
    inbound.set(r.to, (inbound.get(r.to) ?? 0) + 1)
    if (!r.why.en && !r.why.nl) err(file, `relation ${r.verb} → ${r.to} has no reason`)
    for (const k of r.sources) {
      if (!sourceKeys.has(k)) err(file, `relation ${r.verb} → ${r.to} cites unknown source "${k}"`)
      citedSources.add(k)
    }
    if (r.review && e.status !== "draft") err(file, `relation ${r.verb} → ${r.to} is still marked for review, so the entry must stay a draft`)
  }
  // problems: a reading list and search words
  if (e.type !== "problem" && (e.start.length || e.terms.length)) err(file, "only problem entries carry start or terms")
  for (const k of e.start) {
    if (k === e.id) err(file, "a problem cannot start from itself")
    if (!entryIds.has(k)) err(file, `start "${k}" points at no entry`)
    inbound.set(k, (inbound.get(k) ?? 0) + 1)
  }
  if (e.type === "problem" && e.start.length === 0) err(file, "problem entries need at least one start entry")

  if (e.relations.length < 2) warn(file, `has ${e.relations.length} outbound relation(s); aim for at least 2`)

  // sources
  for (const k of e.sources) {
    if (!sourceKeys.has(k)) err(file, `cites unknown source "${k}"`)
    citedSources.add(k)
  }
  const verifiedCount = e.sources.filter((k) => sources.find((s) => s.key === k)?.verified).length
  if (e.status === "verified" && verifiedCount < 2) err(file, `verified entries need at least 2 verified sources (has ${verifiedCount})`)

  // languages
  for (const lang of ["en", "nl"] as const) {
    const missing = [!e.title[lang] && "title", !e.summary[lang] && "summary", !body[lang] && "body"].filter(Boolean)
    if (missing.length === 0) continue
    const msg = `${lang.toUpperCase()} missing: ${missing.join(", ")}`
    if (e.status === "draft") warn(file, msg)
    else err(file, `${msg} (required once an entry is ${e.status})`)
  }
  if (!e.title.en && !e.title.nl) err(file, "needs a title in at least one language")

  // species need a latin name
  if (e.type === "species" && !e.taxon) err(file, "species entries need taxon.latin")
}

// orphans: no relation in or out
for (const { file, data: e } of entries) {
  if (e.relations.length === 0 && e.start.length === 0 && !inbound.get(e.id)) err(file, "is an orphan: no relation in or out")
}

for (const s of sources) if (!citedSources.has(s.key)) warn("sources.yaml", `source "${s.key}" is cited by no entry`)

// report
const errors = problems.filter((p) => p.level === "error")
const warnings = problems.filter((p) => p.level === "warning")
const stats = {
  entries: entries.length,
  byStatus: Object.fromEntries(["draft", "reviewed", "verified"].map((s) => [s, entries.filter((e) => e.data.status === s).length])),
  relations: entries.reduce((n, e) => n + e.data.relations.length, 0),
  relationsToReview: entries.reduce((n, e) => n + e.data.relations.filter((r) => r.review).length, 0),
  sources: sources.length,
  sourcesVerified: sources.filter((s) => s.verified).length,
  bothLanguages: entries.filter((e) => e.data.title.nl && e.data.title.en && e.body.nl && e.body.en).length,
  errors: errors.length,
  warnings: warnings.length,
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ stats, problems }, null, 2))
} else {
  const show = (p: Problem) => console.log(`  ${p.level === "error" ? "✗" : "·"} ${p.where}: ${p.message}`)
  if (errors.length) { console.log(`Errors (${errors.length})`); errors.forEach(show) }
  if (warnings.length && process.argv.includes("--warnings")) { console.log(`Warnings (${warnings.length})`); warnings.forEach(show) }
  console.log(
    `\n${stats.entries} entries (${stats.byStatus.draft} draft, ${stats.byStatus.reviewed} reviewed, ${stats.byStatus.verified} verified) · ` +
      `${stats.relations} relations (${stats.relationsToReview} to review) · ` +
      `${stats.sources} sources (${stats.sourcesVerified} verified) · ${stats.bothLanguages} in both languages`,
  )
  console.log(`${errors.length} errors, ${warnings.length} warnings${warnings.length && !process.argv.includes("--warnings") ? " (show them with --warnings)" : ""}`)
}
process.exit(errors.length ? 1 : 0)
