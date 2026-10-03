/** Reads content/ into typed entries and sources. Shared by the validator and the export. */
import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import YAML from "yaml"
import { Entry, Source } from "../schema/content.ts"

// The repo root, found from this file; when a bundler has moved the code (the site build), the working directory.
const fromFile = path.resolve(import.meta.dirname, "..")
export const ROOT = existsSync(path.join(fromFile, "content")) ? fromFile : process.cwd()
export const ENTRIES_DIR = path.join(ROOT, "content/entries")
export const SOURCES_FILE = path.join(ROOT, "content/sources.yaml")

export type LoadedEntry = {
  file: string
  data: Entry
  /** Body text per language, split on <!-- en --> and <!-- nl --> markers. */
  body: { en: string; nl: string }
}

export type Problem = { level: "error" | "warning"; where: string; message: string }

export function splitBody(content: string): { en: string; nl: string } {
  const out = { en: "", nl: "" }
  const parts = content.split(/<!--\s*(en|nl)\s*-->/)
  for (let i = 1; i < parts.length; i += 2) out[parts[i] as "en" | "nl"] = parts[i + 1].trim()
  return out
}

export function loadEntries(problems: Problem[]): LoadedEntry[] {
  const files = readdirSync(ENTRIES_DIR).filter((f) => f.endsWith(".md")).sort()
  const entries: LoadedEntry[] = []
  for (const f of files) {
    const raw = readFileSync(path.join(ENTRIES_DIR, f), "utf8")
    const { data, content } = matter(raw)
    // gray-matter turns YAML dates into Date objects; the schema wants the plain string
    if (data.updated instanceof Date) data.updated = data.updated.toISOString().slice(0, 10)
    const parsed = Entry.safeParse(data)
    if (!parsed.success) {
      for (const issue of parsed.error.issues)
        problems.push({ level: "error", where: f, message: `${issue.path.join(".") || "(root)"}: ${issue.message}` })
      continue
    }
    entries.push({ file: f, data: parsed.data, body: splitBody(content) })
  }
  return entries
}

export function loadSources(problems: Problem[]): Source[] {
  const list = YAML.parse(readFileSync(SOURCES_FILE, "utf8")) ?? []
  const sources: Source[] = []
  for (const [i, s] of list.entries()) {
    const parsed = Source.safeParse(s)
    if (!parsed.success) {
      for (const issue of parsed.error.issues)
        problems.push({ level: "error", where: `sources.yaml #${i + 1} (${s?.key ?? "?"})`, message: `${issue.path.join(".") || "(root)"}: ${issue.message}` })
      continue
    }
    sources.push(parsed.data)
  }
  return sources
}
