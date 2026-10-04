/**
 * The knowledge graph as a picture: a force-directed layout computed once at
 * build time and written out as static SVG. Seeded, so the same content always
 * gives the same picture; no JavaScript reaches the browser.
 */
import { entries, type LoadedEntry } from "./content.ts"

export type GNode = { id: string; domain: string; x: number; y: number; r: number; degree: number }
export type GEdge = { from: string; to: string; grade: string }

/** Small seeded PRNG (mulberry32): deterministic layouts across builds. */
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fruchterman–Reingold in a w×h box. */
export function layout(ids: string[], edges: GEdge[], w: number, h: number, seed = 7, iterations = 400) {
  const rand = rng(seed)
  const pos = new Map(ids.map((id) => [id, { x: rand() * w, y: rand() * h }]))
  const k = Math.sqrt((w * h) / Math.max(ids.length, 1)) * 0.9
  let temp = w / 8
  for (let it = 0; it < iterations; it++) {
    const disp = new Map(ids.map((id) => [id, { x: 0, y: 0 }]))
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) {
        const a = pos.get(ids[i])!, b = pos.get(ids[j])!
        let dx = a.x - b.x, dy = a.y - b.y
        const d = Math.max(Math.hypot(dx, dy), 0.01)
        const f = (k * k) / d
        dx = (dx / d) * f; dy = (dy / d) * f
        disp.get(ids[i])!.x += dx; disp.get(ids[i])!.y += dy
        disp.get(ids[j])!.x -= dx; disp.get(ids[j])!.y -= dy
      }
    for (const e of edges) {
      const a = pos.get(e.from), b = pos.get(e.to)
      if (!a || !b) continue
      const dx = a.x - b.x, dy = a.y - b.y
      const d = Math.max(Math.hypot(dx, dy), 0.01)
      const f = (d * d) / k
      disp.get(e.from)!.x -= (dx / d) * f; disp.get(e.from)!.y -= (dy / d) * f
      disp.get(e.to)!.x += (dx / d) * f; disp.get(e.to)!.y += (dy / d) * f
    }
    for (const id of ids) {
      const p = pos.get(id)!, v = disp.get(id)!
      // a gentle pull to the centre keeps loose nodes on the canvas
      v.x += (w / 2 - p.x) * 0.02; v.y += (h / 2 - p.y) * 0.02
      const len = Math.max(Math.hypot(v.x, v.y), 0.01)
      p.x = Math.min(w - 24, Math.max(24, p.x + (v.x / len) * Math.min(len, temp)))
      p.y = Math.min(h - 24, Math.max(24, p.y + (v.y / len) * Math.min(len, temp)))
    }
    temp *= 0.985
  }
  return pos
}

const allEdges: GEdge[] = entries.flatMap((e) => [
  ...e.data.relations.map((r) => ({ from: e.data.id, to: r.to, grade: r.grade })),
  // a problem's reading list draws as faint lines too: it is how the problem connects
  ...e.data.start.map((to) => ({ from: e.data.id, to, grade: "start" })),
])
const degree = new Map<string, number>()
for (const e of allEdges) for (const id of [e.from, e.to]) degree.set(id, (degree.get(id) ?? 0) + 1)

/** The whole corpus, for the home page. */
export function wholeGraph(w = 640, h = 520) {
  const ids = entries.map((e) => e.data.id)
  const pos = layout(ids, allEdges, w, h)
  const nodes: GNode[] = entries.map((e) => {
    const p = pos.get(e.data.id)!
    const deg = degree.get(e.data.id) ?? 0
    return { id: e.data.id, domain: e.data.domain, x: p.x, y: p.y, r: 4 + Math.sqrt(deg) * 2.2, degree: deg }
  })
  return { nodes, edges: allEdges, w, h }
}

/**
 * One entry and its direct neighbours, for its own page: the entry in the
 * middle, the neighbours on one ring with labels pointing outward, so
 * every label has room. Neighbours are ordered by domain, so colours group.
 */
export function neighbourhood(e: LoadedEntry, w = 680, h = 380) {
  const id = e.data.id
  const edges = allEdges.filter((x) => x.from === id || x.to === id)
  const byId = new Map(entries.map((x) => [x.data.id, x]))
  const others = [...new Set(edges.flatMap((x) => [x.from, x.to]))].filter((n) => n !== id)
  others.sort((a, b) => byId.get(a)!.data.domain.localeCompare(byId.get(b)!.data.domain) || a.localeCompare(b))
  const nodes: GNode[] = [{ id, domain: e.data.domain, x: w / 2, y: h / 2, r: 14, degree: degree.get(id) ?? 0 }]
  others.forEach((n, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / others.length
    nodes.push({
      id: n,
      domain: byId.get(n)!.data.domain,
      x: w / 2 + Math.cos(angle) * w * 0.2,
      y: h / 2 + Math.sin(angle) * h * 0.4,
      r: 8,
      degree: degree.get(n) ?? 0,
    })
  })
  return { nodes, edges, w, h }
}
