"""One-off migration of G-eog's 12 diagnose problems (src/lib/knowledge/diagnose.ts, 9 Aug 2026).

Input: a JSON dump of the SYMPTOMS array. Kept as the record of how each problem entry was produced.

What it does, and does not do:
- Each symptom becomes a draft `problem` entry: label → title, lead → summary, both languages as G-eog had them.
- G-eog's `entries` (where the problem is best understood from) become `start`, a reading list.
  They are not relations: G-eog gave no reason or grade per link, and none is invented here.
- `terms` (search words) are kept, duplicates removed.
- The domain is chosen per problem below; G-eog had none.
- No body text: G-eog had none. The validator lists it as missing.
- G-eog's mechanism walk (explain()) is interface, not content, and is not migrated.
"""
import json
import sys
from pathlib import Path

import yaml

SRC = Path(sys.argv[1])
REPO = Path(__file__).resolve().parents[2]
ENTRIES = REPO / "content/entries"
TODAY = "2026-10-03"

DOMAIN = {
    "compacted-soil": "soil",
    "water-runs-off": "water",
    "dries-out": "water",
    "weak-plants": "plants-fungi",
    "few-pollinators": "animals-biodiversity",
    "bare-ground": "soil",
    "low-biodiversity": "animals-biodiversity",
    "nothing-under-trees": "plants-fungi",
    "too-much-waste": "soil",
    "store-carbon": "systems",
    "start-food-forest": "design-practice",
    "too-hot": "design-practice",
}

symptoms = json.loads(SRC.read_text())["SYMPTOMS"]
for s in symptoms:
    if (ENTRIES / f"{s['id']}.md").exists():
        sys.exit(f"{s['id']} already exists")
    front = {
        "id": s["id"],
        "type": "problem",
        "domain": DOMAIN[s["id"]],
        "title": s["label"],
        "summary": s["lead"],
        "status": "draft",
        "tags": [],
        "region": [],
        "relations": [],
        "start": s["entries"],
        "terms": list(dict.fromkeys(s["terms"])),
        "sources": [],
        "updated": TODAY,
        "origin": "G-eog diagnose.ts, 9 Aug 2026",
    }
    text = "---\n" + yaml.safe_dump(front, sort_keys=False, allow_unicode=True, width=100) + "---\n\n<!-- en -->\n\n<!-- nl -->\n"
    (ENTRIES / f"{s['id']}.md").write_text(text)
print(f"{len(symptoms)} problem entries written")
