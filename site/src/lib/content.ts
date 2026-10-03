/**
 * The site reads content through the same loader as the validator and the
 * dataset export, so there is one reading of content/ and no second schema.
 */
import { loadEntries, loadSources, type LoadedEntry, type Problem } from "../../../scripts/load.ts"
import type { Source } from "../../../schema/content.ts"
import type { Lang } from "./i18n.ts"

const problems: Problem[] = []
export const entries = loadEntries(problems)
export const sources = loadSources(problems)
const errors = problems.filter((p) => p.level === "error")
if (errors.length) throw new Error(`content has ${errors.length} errors; run npm run validate`)

export const byId = new Map(entries.map((e) => [e.data.id, e]))
export const sourceByKey = new Map(sources.map((s) => [s.key, s]))
export type { LoadedEntry, Source }

/** A text in the asked language, or the other one, marked so the page can say so. */
export type Text = { text: string; lang: Lang; fallback: boolean }
export function pick(b: { en: string; nl: string }, lang: Lang): Text {
  if (b[lang]) return { text: b[lang], lang, fallback: false }
  const other: Lang = lang === "nl" ? "en" : "nl"
  return { text: b[other], lang: other, fallback: true }
}

export const inbound = new Map<string, { from: LoadedEntry; r: LoadedEntry["data"]["relations"][number] }[]>()
for (const e of entries) for (const r of e.data.relations) inbound.set(r.to, [...(inbound.get(r.to) ?? []), { from: e, r }])

export const startedFrom = new Map<string, LoadedEntry[]>()
for (const e of entries) for (const k of e.data.start) startedFrom.set(k, [...(startedFrom.get(k) ?? []), e])

export const citedBy = new Map<string, LoadedEntry[]>()
for (const e of entries) for (const k of e.data.sources) citedBy.set(k, [...(citedBy.get(k) ?? []), e])

export const relationCount = entries.reduce((n, e) => n + e.data.relations.length, 0)
export const verifiedCount = sources.filter((s) => s.verified).length
