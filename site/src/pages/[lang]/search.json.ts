/**
 * The command palette's index: every entry, problem, source and page, small
 * enough to load whole on first open. Full-text search over entry bodies
 * comes from Pagefind, which the palette loads only when you type.
 */
import type { APIRoute } from "astro"
import { entries, pick, sources } from "../../lib/content.ts"
import { DOMAINS, GRADES, entryHref, langPaths, t, type Lang } from "../../lib/i18n.ts"

export const getStaticPaths = langPaths

export const GET: APIRoute = ({ params }) => {
  const lang = params.lang as Lang
  const ui = t(lang)
  const items = [
    ...entries.map((e) => ({
      kind: e.data.type === "problem" ? "problem" : "entry",
      href: entryHref(lang, e.data.id),
      title: pick(e.data.title, lang).text,
      sub: pick(e.data.summary, lang).text,
      meta: DOMAINS[e.data.domain][lang][0],
      terms: [...e.data.terms, ...e.data.tags].join(" "),
    })),
    ...sources.map((s) => ({
      kind: "source",
      href: `/${lang}/sources/#${s.key}`,
      title: s.title,
      sub: `${s.authors} (${s.year})`,
      meta: s.verified ? ui.verified : ui.unverified,
      terms: [s.doi, s.isbn, s.container].filter(Boolean).join(" "),
    })),
    { kind: "page", href: `/${lang}/`, title: ui.nav.entries, sub: ui.description, meta: "", terms: "" },
    { kind: "page", href: `/${lang}/sources/`, title: ui.nav.sources, sub: ui.sourcesLead(sources.length, sources.filter((s) => s.verified).length), meta: "", terms: "" },
    { kind: "page", href: `/${lang}/contribute/`, title: ui.nav.contribute, sub: Object.values(GRADES).map((g) => g[lang][0]).join(", "), meta: "", terms: "" },
  ]
  return new Response(JSON.stringify(items), { headers: { "content-type": "application/json" } })
}
