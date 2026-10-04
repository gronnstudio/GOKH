# Contributing to Equilibrium

Anyone can propose a change. A steward decides what is merged. Everything published is free to reuse under CC BY-SA 4.0.

## Three ways in

1. **Edit a file.** Every entry is one Markdown file in `content/entries/`. Edit it on GitHub and open a pull request.
2. **Suggest something.** Open an issue: what is missing or wrong, and where you know it from. No GitHub account? Email hello@gronn.studio.
3. **Resolve a source.** Pick an entry in `content/sources.yaml` with `verified: false`, find its DOI or ISBN, check it on the publisher's or a registry's page, add it and set `verified: true`.

## The rules every change follows

- **Nothing invented.** No made-up people, numbers, sources or results. If you can't point to where a fact comes from, say so: the claim stays unverified, and that is fine.
- **Your own words.** Facts can come from anywhere; text cannot. Never paste text from a source unless its licence allows reuse under CC BY-SA (CC0, CC BY and CC BY-SA do; "non-commercial" and "all rights reserved" do not). Short quotes, with the source, are the exception.
- **Every relation says why.** One sentence on why A relates to B, a grade for how sure we are, and a source when there is one.
- **Dutch first.** The hub is in Dutch for now; other languages follow later (decision 0003). A draft may be incomplete; reviewed and verified entries need Dutch title, summary and text.
- **No bylines.** Entries carry no author names. Your credit is the Git history and the contributors page.

## Review ladder

| Status | Means | Who sets it |
| --- | --- | --- |
| draft | Proposed; may have gaps, unreviewed relations or one language | Anyone |
| reviewed | Sources and wording checked, Dutch complete, every relation reviewed | The steward |
| verified | A domain reviewer signed off; at least two verified sources | A domain reviewer |

`npm run validate` enforces the parts of this a machine can check.

## AI

AI may help draft translations, propose relations and look up identifiers, inside a pull request where a person reviews the result. It never publishes, never invents a source, and never decides a grade on its own.

## Partners

Organisations can support the hub's growth and upkeep: funding maintenance, offering field sites for cases and trials, or lending a domain reviewer. Partners are credited on a partners page. They never buy content, placement, evidence grades or verification, and their own claims follow the same source rules as everything else.
