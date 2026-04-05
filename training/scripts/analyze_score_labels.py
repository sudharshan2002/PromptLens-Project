"""Analyze score-label distribution and summary statistics in a CSV dataset.

Dataset labels derived from:
  - Stanford Alpaca (tatsu-lab/alpaca) — Taori, R. et al., 2023
  - Databricks Dolly 15k (databricks/databricks-dolly-15k) — Conover, M. et al., 2023
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path


TARGETS = ("trust_target", "clarity_target", "quality_target")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    rows = list(csv.DictReader(Path(args.input).open("r", encoding="utf-8-sig", newline="")))
    if not rows:
        raise ValueError("No rows found in the input CSV.")

    summary = {"rows": len(rows), "targets": {}}
    for target in TARGETS:
        values = [float(row[target]) for row in rows if str(row.get(target, "")).strip()]
        values.sort()
        mean = sum(values) / len(values)
        summary["targets"][target] = {
            "min": round(min(values), 4),
            "max": round(max(values), 4),
            "mean": round(mean, 4),
            "p25": round(values[int(len(values) * 0.25)], 4),
            "median": round(values[int(len(values) * 0.5)], 4),
            "p75": round(values[int(len(values) * 0.75)], 4),
        }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"Wrote score label analysis to {output_path}")


if __name__ == "__main__":
    main()
