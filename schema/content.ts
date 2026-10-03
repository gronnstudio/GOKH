/**
 * The Equilibrium content schema. One file in content/entries is one entry;
 * content/sources.yaml holds every source. This file is the contract the
 * validator enforces and the site and dataset export read from.
 */
import { z } from "zod"

/** Six domains. Former categories survive as tags, so no shelf is ever empty. */
export const DOMAINS = ["soil", "water", "plants-fungi", "animals-biodiversity", "design-practice", "systems"] as const

export const ENTRY_TYPES = ["concept", "species", "technique", "problem", "field-case"] as const

/** Seven verbs. A relation reads "<this entry> <verb> <to>". */
export const VERBS = ["part-of", "needs", "enables", "improves", "harms", "partners-with", "applies-to"] as const

/** How sure we are about a relation or claim. */
export const GRADES = ["established", "supported", "emerging", "contested"] as const

export const STATUSES = ["draft", "reviewed", "verified"] as const

const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "ids are lowercase kebab-case")

/** Dutch and English. While an entry is a draft one language may be empty. */
const bilingual = z.object({ en: z.string().default(""), nl: z.string().default("") })

export const Relation = z
  .object({
    to: id,
    verb: z.enum(VERBS),
    why: bilingual,
    grade: z.enum(GRADES),
    sources: z.array(id).default([]),
    /** Migration only: the verb this relation had in G-eog, kept until a person reviews it. */
    was: z.string().optional(),
    /** Migration only: true until a person has checked the remapped verb. */
    review: z.boolean().optional(),
  })
  .strict()

export const Entry = z
  .object({
    id,
    type: z.enum(ENTRY_TYPES),
    domain: z.enum(DOMAINS),
    title: bilingual,
    summary: bilingual,
    status: z.enum(STATUSES),
    level: z.enum(["foundational", "intermediate", "advanced"]).optional(),
    tags: z.array(id).default([]),
    region: z.array(z.enum(["nl", "be"])).default([]),
    /** Months (1–12) the entry is most relevant, e.g. a planting window. */
    months: z.array(z.number().int().min(1).max(12)).default([]),
    /** Species only: external identifiers, never copied attributes. */
    taxon: z
      .object({ latin: z.string(), gbif: z.number().int().optional(), wikidata: z.string().regex(/^Q\d+$/).optional() })
      .strict()
      .optional(),
    relations: z.array(Relation).default([]),
    sources: z.array(id).default([]),
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** Where a migrated entry came from, for the review trail. */
    origin: z.string().optional(),
  })
  .strict()

export const Source = z
  .object({
    key: id,
    type: z.enum(["paper", "book", "report", "institutional", "web", "dataset", "field-notes"]),
    authors: z.string(),
    year: z.number().int(),
    title: z.string(),
    container: z.string().optional(),
    doi: z.string().regex(/^10\.\d{4,9}\/\S+$/).optional(),
    isbn: z.string().regex(/^(97[89])?\d{9}[\dX]$/).optional(),
    url: z.string().url().optional(),
    /** True only when an identifier was checked against the publisher or a registry. */
    verified: z.boolean(),
    /** Licence of the source itself, when we reuse its text or data (see the source register). */
    licence: z.string().optional(),
  })
  .strict()
  .refine((s) => !s.verified || s.doi || s.isbn || s.url, {
    message: "a verified source needs a DOI, ISBN or URL",
  })

export type Entry = z.infer<typeof Entry>
export type Relation = z.infer<typeof Relation>
export type Source = z.infer<typeof Source>
