/**
 * Turns design/tokens.json (W3C Design Tokens Format 2025.10) into CSS custom
 * properties, and audits every text colour pair for WCAG contrast in both themes.
 *
 *   npm run tokens            write site/src/styles/tokens.css
 *   npm run tokens -- --check fail if tokens.css is stale or a pair is below AA (CI)
 */
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { contrast } from "./color.ts"
import { ROOT } from "./load.ts"

const SRC = path.join(ROOT, "design/tokens.json")
const OUT = path.join(ROOT, "site/src/styles/tokens.css")
const DARK = "studio.gronn.dark"

type Node = Record<string, any>
const tokens: Node = JSON.parse(readFileSync(SRC, "utf8"))

function get(ref: string): Node {
  const node = ref.replace(/^\{|\}$/g, "").split(".").reduce((n: Node, k) => n?.[k], tokens)
  if (!node || !("$value" in node)) throw new Error(`unknown token ${ref}`)
  return node
}
/** Follows aliases ("{color.antraciet}") to the token that holds a real value. */
function resolve(value: any): any {
  return typeof value === "string" && value.startsWith("{") ? resolve(get(value).$value) : value
}

const colorName = (ref: string) => `--color-${ref.replace(/^\{color\.|\}$/g, "")}`
const oklch = (v: any) => `oklch(${v.components[0]} ${v.components[1]} ${v.components[2]})`
const px = (v: any) => `${v.value}${v.unit}`
const entries = (group: Node) => Object.entries(group).filter(([k]) => !k.startsWith("$"))

/** clamp() from a min at 390px to a max at 1280px; the slope's intercept in rem so text still grows with zoom. */
function fluid(min: number, max: number) {
  if (min === max) return `${min}px`
  const slope = (max - min) / (1280 - 390)
  const intercept = min - slope * 390
  return `clamp(${min}px, ${(intercept / 16).toFixed(4)}rem + ${(slope * 100).toFixed(4)}vw, ${max}px)`
}

const lines: string[] = []
const add = (name: string, value: string, note?: string) => lines.push(`    ${name}: ${value};${note ? ` /* ${note} */` : ""}`)

for (const [k, t] of entries(tokens.color)) add(`--color-${k}`, oklch(t.$value))
for (const [k, t] of entries(tokens.theme)) add(`--${k}`, `light-dark(var(${colorName(t.$value)}), var(${colorName(t.$extensions[DARK])}))`, t.$description)
for (const [k, t] of entries(tokens.font)) add(`--font-${k}`, t.$value.map((f: string) => (/\s/.test(f) ? `"${f}"` : f)).join(", "))
for (const [k, t] of entries(tokens.text)) add(`--text-${k}`, fluid(t.min.$value.value, t.max.$value.value))
for (const [k, t] of entries(tokens.space)) add(`--space-${k}`, px(t.$value))
for (const [k, t] of entries(tokens.radius)) add(`--radius-${k}`, px(t.$value))
for (const [k, t] of entries(tokens.layout)) add(`--layout-${k}`, px(t.$value))
for (const [k, t] of entries(tokens.duration)) add(`--duration-${k}`, px(t.$value))
for (const [k, t] of entries(tokens.ease)) add(`--ease-${k}`, `cubic-bezier(${t.$value.join(", ")})`)

const css = `/* Generated from design/tokens.json by \`npm run tokens\`. Do not edit by hand. */
@layer tokens {
  :root {
    color-scheme: light dark;
${lines.join("\n")}
  }
  :root[data-theme="light"] { color-scheme: light; }
  :root[data-theme="dark"] { color-scheme: dark; }
}
`

// --- contrast audit: every text colour on every ground it is used on, in both themes
const hexOf = (ref: string) => resolve(get(ref).$value).hex as string
const theme = (k: string, dark: boolean) => {
  const t = tokens.theme[k]
  return hexOf(dark ? t.$extensions[DARK] : t.$value)
}
const TEXT = ["ink", "muted", "heading", "link", "established", "supported", "emerging", "contested"]
const GROUNDS = ["paper", "surface"]
const failures: string[] = []
let checked = 0
for (const dark of [false, true]) {
  const pairs: [string, string][] = TEXT.flatMap((fg) => GROUNDS.map((bg) => [fg, bg] as [string, string]))
  pairs.push(["on-accent", "accent-fill"])
  // Domain hues: as text on the page, as text on their own tint, and as a fill under paper-coloured text.
  for (const k of Object.keys(tokens.theme).filter((k) => /^domain-[a-z-]+$/.test(k) && !k.endsWith("-tint"))) {
    pairs.push([k, "paper"], [k, "surface"], [k, `${k}-tint`], ["ink", `${k}-tint`], ["paper", k])
  }
  for (const [fg, bg] of pairs) {
    const ratio = contrast(theme(fg, dark), theme(bg, dark))
    checked++
    if (ratio < 4.5) failures.push(`${dark ? "dark" : "light"}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1 (needs 4.5)`)
  }
}

if (process.argv.includes("--check")) {
  let stale = false
  try { stale = readFileSync(OUT, "utf8") !== css } catch { stale = true }
  if (stale) failures.push("site/src/styles/tokens.css is out of date: run npm run tokens")
} else {
  writeFileSync(OUT, css)
  console.log(`wrote ${path.relative(ROOT, OUT)}`)
}
console.log(`contrast: ${checked} pairs checked in both themes, ${failures.length} problem(s)`)
for (const f of failures) console.log(`  ✗ ${f}`)
process.exit(failures.length ? 1 : 0)
