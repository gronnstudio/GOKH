/**
 * The command palette and the keyboard shortcuts, without a framework.
 *
 * The mechanism is ported from gronn-studio's palette (src/components/search/
 * command-palette.tsx): Cmd/Ctrl K, live prefix-then-substring suggestions
 * grouped by kind, a keyboard cursor, recent picks kept on the device, the
 * matched run highlighted. Added here: full-text hits from Pagefind, loaded
 * only once you type.
 *
 * Single-key shortcuts (/ ? g… t l j k) can be switched off in the help sheet,
 * as WCAG 2.1.4 asks; Cmd/Ctrl K holds a modifier and always works.
 */
type Item = { kind: string; href: string; title: string; sub: string; meta: string; terms: string }
type Hit = Item & { field: "title" | "sub" | "text"; at: number; len: number; html?: string }

const dialog = document.querySelector<HTMLDialogElement>("dialog.palette")!
const input = dialog.querySelector<HTMLInputElement>("input")!
const list = dialog.querySelector<HTMLUListElement>("[role=listbox]")!
const empty = dialog.querySelector<HTMLParagraphElement>(".palette-empty")!
const help = document.querySelector<HTMLDialogElement>("dialog.keys")!
const lang = document.documentElement.lang
const L = JSON.parse(dialog.dataset.labels!) as Record<string, string>

const RECENT = "equilibrium-recent"
const read = (k: string, d: string) => { try { return localStorage.getItem(k) ?? d } catch { return d } }
const write = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch {} }
const recent = (): string[] => { try { return JSON.parse(read(RECENT, "[]")) } catch { return [] } }

let index: Item[] | null = null
let hits: Hit[] = []
let cursor = 0
let pagefind: any = null
let seq = 0

async function load() {
  index ??= await fetch(`/${lang}/search.json`).then((r) => r.json())
  return index!
}

/** Prefix beats substring beats summary and search words; then groups by kind, as in gronn-studio. */
function rank(q: string, items: Item[]): Hit[] {
  const scored: [number, Hit][] = []
  for (const it of items) {
    const ti = it.title.toLowerCase().indexOf(q)
    if (ti === 0) scored.push([0, { ...it, field: "title", at: 0, len: q.length }])
    else if (ti > 0) scored.push([1, { ...it, field: "title", at: ti, len: q.length }])
    else {
      const si = it.sub.toLowerCase().indexOf(q)
      if (si >= 0) scored.push([2, { ...it, field: "sub", at: si, len: q.length }])
      else if (it.terms.toLowerCase().includes(q)) scored.push([3, { ...it, field: "sub", at: -1, len: 0 }])
    }
  }
  const take = { problem: 4, entry: 6, page: 2, source: 4 } as Record<string, number>
  return Object.keys(take).flatMap((k) =>
    scored.filter(([, h]) => h.kind === k).sort((a, b) => a[0] - b[0] || a[1].title.localeCompare(b[1].title)).slice(0, take[k]).map(([, h]) => h),
  )
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)
const mark = (s: string, at: number, len: number) =>
  at < 0 || !len ? esc(s) : `${esc(s.slice(0, at))}<mark>${esc(s.slice(at, at + len))}</mark>${esc(s.slice(at + len))}`

function render() {
  list.innerHTML = hits
    .map((h, i) => `<li role="option" id="pal-${i}" aria-selected="${i === cursor}" data-i="${i}">
  <span class="pal-kind">${esc(L[h.kind] ?? h.kind)}</span>
  <span class="pal-main"><a href="${h.href}" tabindex="-1">${h.field === "title" ? mark(h.title, h.at, h.len) : esc(h.title)}</a>
  <span class="pal-sub">${h.html ?? (h.field === "sub" ? mark(h.sub, h.at, h.len) : esc(h.sub))}</span></span>
  ${h.meta ? `<span class="pal-meta">${esc(h.meta)}</span>` : ""}
</li>`)
    .join("")
  input.setAttribute("aria-activedescendant", hits.length ? `pal-${cursor}` : "")
  empty.hidden = hits.length > 0
  empty.textContent = input.value.trim() ? L.nothing : L.hint
  list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" })
}

async function update() {
  const q = input.value.trim().toLowerCase()
  const mine = ++seq
  const items = await load()
  if (!q) {
    hits = recent().map((href) => items.find((i) => i.href === href)).filter(Boolean).map((i) => ({ ...i!, kind: "recent", field: "title" as const, at: -1, len: 0 }))
  } else hits = rank(q, items)
  cursor = 0
  render()
  if (q.length < 3) return
  // Full text: what the titles and summaries miss, from inside the entries themselves.
  try {
    pagefind ??= await import(/* @vite-ignore */ `${"/pagefind/"}pagefind.js`)
    const res = await pagefind.debouncedSearch(q, {}, 200)
    if (!res || mine !== seq) return
    const seen = new Set(hits.map((h) => h.href))
    const more = await Promise.all(res.results.slice(0, 5).map((r: any) => r.data()))
    for (const d of more) {
      if (seen.has(d.url)) continue
      hits.push({ kind: "text", href: d.url, title: d.meta.title, sub: "", html: d.excerpt, meta: "", terms: "", field: "text", at: -1, len: 0 })
    }
    render()
  } catch { /* no index in dev: titles and summaries still work */ }
}

function go(i: number) {
  const h = hits[i]
  if (!h) return
  write(RECENT, JSON.stringify([h.href, ...recent().filter((x) => x !== h.href)].slice(0, 5)))
  dialog.close()
  location.href = h.href
}

export function openPalette(q = "") {
  if (!dialog.open) dialog.showModal()
  input.value = q
  input.focus()
  update()
}

input.addEventListener("input", update)
input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "n")) { e.preventDefault(); cursor = Math.min(cursor + 1, hits.length - 1); render() }
  else if (e.key === "ArrowUp" || (e.ctrlKey && e.key === "p")) { e.preventDefault(); cursor = Math.max(cursor - 1, 0); render() }
  else if (e.key === "Enter") { e.preventDefault(); go(cursor) }
})
list.addEventListener("click", (e) => {
  const li = (e.target as HTMLElement).closest<HTMLElement>("[data-i]")
  if (!li) return
  e.preventDefault()
  go(Number(li.dataset.i))
})
list.addEventListener("pointermove", (e) => {
  const li = (e.target as HTMLElement).closest<HTMLElement>("[data-i]")
  if (li && Number(li.dataset.i) !== cursor) { cursor = Number(li.dataset.i); render() }
})
for (const d of [dialog, help]) d.addEventListener("click", (e) => { if (e.target === d) d.close() })
document.addEventListener("click", (e) => {
  const t = (e.target as HTMLElement).closest("[data-open-palette]")
  if (t) { e.preventDefault(); openPalette() }
  if ((e.target as HTMLElement).closest("[data-open-keys]")) help.showModal()
})

// Show the shortcut the way this keyboard writes it.
if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent))
  for (const k of document.querySelectorAll("[data-mod-k]")) k.textContent = "Ctrl K"

// --- shortcuts
const toggle = help.querySelector<HTMLInputElement>("input[type=checkbox]")!
const singleKeys = () => read("shortcuts", "on") === "on"
toggle.checked = singleKeys()
toggle.addEventListener("change", () => write("shortcuts", toggle.checked ? "on" : "off"))

const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
let armed = 0
const GO: Record<string, string> = { h: "", k: "", s: "sources/", b: "sources/", c: "contribute/" }

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault()
    dialog.open ? dialog.close() : openPalette()
    return
  }
  if (!singleKeys() || typing(e.target) || e.metaKey || e.ctrlKey || e.altKey || dialog.open || help.open) return
  const key = e.key
  if (Date.now() - armed < 1200) {
    armed = 0
    if (key.toLowerCase() in GO) { e.preventDefault(); location.href = `/${lang}/${GO[key.toLowerCase()]}` }
    return
  }
  if (key === "g") { armed = Date.now(); return }
  if (key === "/") { e.preventDefault(); openPalette() }
  else if (key === "?") { e.preventDefault(); help.showModal() }
  else if (key === "t") document.querySelector<HTMLButtonElement>("[data-theme-toggle]")?.click()
  else if (key === "l") document.querySelector<HTMLAnchorElement>("[data-lang-switch]")?.click()
  else if (key === "j" || key === "k") {
    // Walk the page's main links: cards on lists, connections on entries.
    const items = [...document.querySelectorAll<HTMLAnchorElement>("main [data-walk]")]
    if (!items.length) return
    e.preventDefault()
    const at = items.indexOf(document.activeElement as HTMLAnchorElement)
    const next = key === "j" ? Math.min(at + 1, items.length - 1) : Math.max(at - 1, 0)
    items[at < 0 ? 0 : next].focus()
    items[at < 0 ? 0 : next].scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
  }
})
