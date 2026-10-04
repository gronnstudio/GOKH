/**
 * Weighs every built page: the JavaScript and CSS it loads up front, gzipped.
 * Run after `npm run build:site`; CI fails when a page is over budget (decision 0002).
 *
 *   own JS    our inline scripts (the theme switch)       ≤ 2 KB
 *   all JS    everything loaded at page load, incl. search ≤ 50 KB
 *   CSS       every stylesheet the page links             ≤ 30 KB
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { gzipSync } from "node:zlib"
import { ROOT } from "./load.ts"

const SITE = path.join(ROOT, "dist/site")
const BUDGET = { ownJs: 2 * 1024, allJs: 50 * 1024, css: 30 * 1024 }

const gz = (s: string | Buffer) => gzipSync(s).length
const asset = (url: string) => readFileSync(path.join(SITE, url.split("?")[0]))
const pages = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f)
    return statSync(p).isDirectory() ? (f === "pagefind" || f === "_astro" ? [] : pages(p)) : f.endsWith(".html") ? [p] : []
  })

const over: string[] = []
let worst = { ownJs: 0, allJs: 0, css: 0 }
const all = pages(SITE)
for (const file of all) {
  const html = readFileSync(file, "utf8")
  const page = "/" + path.relative(SITE, file)
  // Inline scripts that run code; JSON blocks such as speculation rules are data.
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="(?:speculationrules|application\/(?:ld\+)?json)")[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("")
  const external = [...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map((m) => gz(asset(m[1])))
  const css = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => gz(asset(m[1])))
  const size = { ownJs: inline ? gz(inline) : 0, allJs: (inline ? gz(inline) : 0) + external.reduce((a, b) => a + b, 0), css: css.reduce((a, b) => a + b, 0) }
  for (const k of Object.keys(BUDGET) as (keyof typeof BUDGET)[]) {
    worst[k] = Math.max(worst[k], size[k])
    if (size[k] > BUDGET[k]) over.push(`${page}: ${k} ${(size[k] / 1024).toFixed(1)} KB > ${BUDGET[k] / 1024} KB`)
  }
}

const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`
console.log(`${all.length} pages · heaviest: own JS ${kb(worst.ownJs)} / ${kb(BUDGET.ownJs)}, all JS ${kb(worst.allJs)} / ${kb(BUDGET.allJs)}, CSS ${kb(worst.css)} / ${kb(BUDGET.css)} (gzipped)`)
for (const o of over) console.log(`  ✗ ${o}`)
process.exit(over.length ? 1 : 0)
