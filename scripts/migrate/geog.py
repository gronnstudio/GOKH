"""One-off migration of the G-eog corpus (gronnstudio/G-eog, 9 Aug 2026) into this repo.

Kept in the repo as the record of how every migrated entry was produced.
Input: the JSON dumps of G-eog's src/lib/knowledge/*.ts (articles, relationships, sources).

What it does, and does not do:
- 31 articles become draft concept entries. Every entry stays a draft until a person reviews it.
- The contributor names are dropped: Equilibrium carries no author bylines, and nothing showed
  the seven names were real people.
- 97 relations are remapped from 16 verbs to 7. "contains" is reversed into "part-of".
  Every relation keeps its old verb in `was`; lossy mappings are marked `review: true`.
- Evidence grades are renamed: strong→established, moderate→supported, limited/emerging→emerging.
- 80 sources move to sources.yaml. Only the 6 with a DOI are marked verified, as in G-eog.
- Interactive embeds (3) are dropped; they were interface, not knowledge.
- Dutch is left empty: the validator lists it as missing on every draft.
"""
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

import yaml

RAW = Path(sys.argv[1] if len(sys.argv) > 1 else "/home/claude/corpus/raw/G-eog")
REPO = Path(__file__).resolve().parents[2]
ENTRIES = REPO / "content/entries"
TODAY = "2026-10-03"

DOMAIN = {
    "soil": "soil", "chemistry": "soil", "microbiology": "soil",
    "water": "water", "hydrology": "water",
    "plants": "plants-fungi", "botany": "plants-fungi", "trees": "plants-fungi", "fungi": "plants-fungi",
    "animals": "animals-biodiversity", "biodiversity": "animals-biodiversity",
    "permaculture": "design-practice", "food-forests": "design-practice", "landscape-design": "design-practice",
    "construction": "design-practice", "urban-ecology": "design-practice", "energy": "design-practice",
    "ecology": "systems", "biology": "systems", "climate": "systems", "philosophy": "systems",
    "psychology": "systems", "economics": "systems", "circular-systems": "systems",
}

# old verb -> (new verb, needs human review?)
VERB = {
    "depends_on": ("needs", False), "requires": ("needs", False),
    "enables": ("enables", False), "precedes": ("enables", True), "causes": ("enables", True), "transforms": ("enables", True),
    "supports": ("improves", False), "increases": ("improves", False), "contributes_to": ("improves", True), "regulates": ("improves", True),
    "interacts_with": ("partners-with", True), "exchanges": ("partners-with", True),
    "applied_in": ("applies-to", False), "influences": ("applies-to", True), "associated_with": ("applies-to", True),
    "contains": ("part-of", False),  # direction reversed below
}
GRADE = {"strong": "established", "moderate": "supported", "limited": "emerging", "emerging": "emerging",
         "contested": "contested", "hypothesis": "emerging"}


def load(name, key):
    return json.loads((RAW / f"{name}.json").read_text())[key]


articles = load("articles", "ARTICLES")
relationships = load("relationships", "RELATIONSHIPS")
sources = load("sources", "SOURCES")

# --- sources.yaml
by_title = {s["title"].strip().lower(): s for s in sources}
source_rows = []
for s in sorted(sources, key=lambda s: s["id"]):
    row = {"key": s["id"], "type": s["type"], "authors": s["authors"], "year": s["year"], "title": s["title"]}
    if s.get("publication"):
        row["container"] = s["publication"]
    if s.get("doi"):
        row["doi"] = s["doi"]
    row["verified"] = bool(s.get("doi"))
    source_rows.append(row)

# --- relations, grouped by the entry that will hold them
relations = defaultdict(list)
seen = set()
report = Counter()
for r in relationships:
    verb, review = VERB[r["type"]]
    src, to = r["source"], r["target"]
    if r["type"] == "contains":
        src, to = to, src  # "A contains B" becomes "B part-of A"
    if (src, verb, to) in seen:
        report["duplicate dropped"] += 1
        continue
    seen.add((src, verb, to))
    rel = {"to": to, "verb": verb, "why": {"en": r["description"], "nl": ""}, "grade": GRADE[r["evidence"]], "sources": [], "was": r["type"]}
    if review:
        rel["review"] = True
        report["marked for review"] += 1
    relations[src].append(rel)
    report[f"{r['type']} -> {verb}"] += 1

# --- entries
ENTRIES.mkdir(parents=True, exist_ok=True)
unmatched = []
embeds = 0
for a in articles:
    keys = []
    for c in a.get("citations") or []:
        hit = by_title.get(c["title"].strip().lower())
        if not hit:
            # same work cited under a slightly different title: fall back to first author + year
            surname = c["authors"].split(",")[0].strip().lower()
            same = [s for s in sources if s["year"] == c["year"] and s["authors"].split(",")[0].strip().lower() == surname]
            hit = same[0] if len(same) == 1 else None
        if hit:
            keys.append(hit["id"])
        else:
            unmatched.append((a["slug"], c["title"]))
    front = {
        "id": a["slug"],
        "type": "concept",
        "domain": DOMAIN[a["category"]],
        "title": {"en": a["title"], "nl": ""},
        "summary": {"en": a["summary"], "nl": ""},
        "status": "draft",
        "level": a["difficulty"],
        "tags": sorted(set(a.get("tags") or []) | {a["category"]}),
        "region": [],
        "relations": relations.get(a["slug"], []),
        "sources": sorted(set(keys)),
        "updated": TODAY,
        "origin": f"G-eog articles.ts, last updated {a['updated']}",
    }
    body = []
    for s in a["sections"]:
        if s.get("embed"):
            embeds += 1
        if s.get("heading"):
            body.append(f"## {s['heading']}")
        body.extend(s.get("body") or [])
    text = "---\n" + yaml.safe_dump(front, sort_keys=False, allow_unicode=True, width=100) + "---\n\n<!-- en -->\n\n" + "\n\n".join(body) + "\n\n<!-- nl -->\n"
    (ENTRIES / f"{a['slug']}.md").write_text(text)

(REPO / "content/sources.yaml").write_text(
    "# Every source Equilibrium cites. `verified: true` only when the DOI, ISBN or URL was checked.\n"
    + yaml.safe_dump(source_rows, sort_keys=False, allow_unicode=True, width=100)
)

print(f"{len(articles)} entries, {sum(len(v) for v in relations.values())} relations, {len(source_rows)} sources")
print(f"citations matched: {sum(len(a.get('citations') or []) for a in articles) - len(unmatched)}, unmatched: {len(unmatched)}")
for u in unmatched:
    print("  unmatched:", u)
print(f"embeds dropped: {embeds}")
for k, v in sorted(report.items()):
    print(f"  {k}: {v}")
