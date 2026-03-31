"""Create a fine-tune dataset that oversamples reviewed gold rows."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--silver", required=True)
    parser.add_argument("--gold", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--gold-weight", type=int, default=3)
    return parser.parse_args()


def read_rows(path: Path) -> list[dict[str, str]]:
    return list(csv.DictReader(path.open("r", encoding="utf-8-sig", newline="")))


def write_rows(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    args = parse_args()
    silver_rows = read_rows(Path(args.silver))
    gold_rows = read_rows(Path(args.gold))
    if not silver_rows:
        raise ValueError("No silver rows found.")
    if not gold_rows:
        raise ValueError("No gold rows found.")

    fieldnames = list(silver_rows[0].keys())
    normalized_gold_rows = [{key: row.get(key, "") for key in fieldnames} for row in gold_rows]
    merged_rows = list(silver_rows) + (normalized_gold_rows * max(1, args.gold_weight))
    write_rows(Path(args.output), fieldnames, merged_rows)
    print(f"Wrote fine-tune dataset with {len(merged_rows)} rows to {args.output}")


if __name__ == "__main__":
    main()
