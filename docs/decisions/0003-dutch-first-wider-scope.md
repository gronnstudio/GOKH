# 0003 · Dutch first, wider scope, built to change

- **Status:** decided by the owner, 4 Oct 2026. This record writes it down.
- **Changes:** principle 5 ("Dutch and English for the content itself") and the scope in the standing decisions. See CLAUDE.md.

## What the owner decided

1. **Everything in Dutch for now.** The site publishes Dutch only. More languages follow once the Dutch-speaking audience is reached.
2. **A wider scope.** The hub also covers self-reliance: growing food in a vegetable garden, saving seed, baking bread, fermenting and keeping food. A seventh domain, *Voedsel en zelfredzaamheid* ("Food and self-reliance"), holds these topics.
3. **Free knowledge as the point.** In the owner's words: in a world steered more and more by an elite, there has to be a place where information is freely available. The ambition is to go beyond Wikipedia.
4. **Built to change.** Change is constant, so the platform has to change with it.

## What "beyond Wikipedia" means here, concretely

These are the parts the hub can deliver and check, not a claim about Wikipedia:

| The hub | How it shows on the site |
| --- | --- |
| Says how sure it is about every claim | Every connection carries a grade and a reason. Unverified sources stay visibly unverified. |
| Explains why things connect, not only that they do | Typed relations (needs, enables, improves …), each with one sentence of why |
| Is practical and local | Techniques you can do in a garden in the Netherlands or Flanders, by season, starting from the problem you see |
| Belongs to everyone | Content is CC BY-SA. The whole corpus is a free dataset (JSON/CSV) on every release. No accounts, no paywall, no ads, no membership. |
| Shows its changes | Every change is a Git commit anyone can read. Every page links to its source file and shows when it was updated. |
| Is not tied to one technology | The content is plain Markdown files. The site, search and design can be replaced without touching it (decisions 0001, 0002). |

## How it is built

- **Languages.** `site/src/lib/i18n.ts` lists the published languages (`LANGS = ["nl"]`). The schema and the interface text keep English, so adding a language is a one-line change plus translations.
  - URLs keep the `/nl/` prefix, so pages already shared keep working when a second language arrives.
  - English pages are not built; a request for `/en/…` goes to the Dutch page.
- **Existing entries.** The 31 entries migrated from G-eog were English. They now carry Dutch translations, drafted with AI as CONTRIBUTING.md allows. They stay drafts until a person has reviewed them; English remains in the files for later.
- **New entries** in the food and self-reliance domain are written in Dutch. They cite only sources that were checked, follow the same rules as every other entry, and stay drafts with relations marked for review.

## Open

- **The name.** The repository is GOKH, *Green Open Knowledge Hub*; the site is still called *Equilibrium*. Which name the public site carries is the owner's call.
