"""Analyze BIO label distribution in a segmentation JSONL dataset.

Dataset labels derived from:
  - Stanford Alpaca (tatsu-lab/alpaca) — Taori, R. et al., 2023
  - Databricks Dolly 15k (databricks/databricks-dolly-15k) — Conover, M. et al., 2023
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    counter: Counter[str] = Counter()
    token_count = 0
    row_count = 0
    with Path(args.input).open("r", encoding="utf-8") as handle:
        for line in handle:
            cleaned = line.strip()
            if not cleaned:
                continue
            payload = json.loads(cleaned)
            tags = payload.get("tags", [])
            counter.update(tags)
            token_count += len(tags)
            row_count += 1

    output = {
        "rows": row_count,
        "tokens": token_count,
        "label_counts": dict(counter),
        "label_ratios": {label: round(count / token_count, 6) for label, count in counter.items()} if token_count else {},
    }
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(f"Wrote segmentation label analysis to {output_path}")


if __name__ == "__main__":
    main()
