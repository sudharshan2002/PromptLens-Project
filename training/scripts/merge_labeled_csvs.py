"""Merge multiple normalized Frigate CSV files into one deduplicated table."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


FIELDNAMES = [
    "prompt",
    "mode",
    "output",
    "reference_image_used",
    "trust_target",
    "clarity_target",
    "quality_target",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inputs", nargs="+", required=True, help="Input normalized CSV files")
    parser.add_argument("--output", required=True, help="Merged CSV output path")
    return parser.parse_args()


def row_key(row: dict[str, str]) -> tuple[str, str, str]:
    return (
        row.get("prompt", "").strip().lower(),
        row.get("mode", "").strip().lower(),
        row.get("output", "").strip().lower(),
    )


def main() -> None:
    args = parse_args()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    seen: set[tuple[str, str, str]] = set()
    rows: list[dict[str, str]] = []

    for input_name in args.inputs:
        input_path = Path(input_name)
        with input_path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                normalized = {field: str(row.get(field, "")).strip() for field in FIELDNAMES}
                key = row_key(normalized)
                if not normalized["prompt"] or key in seen:
                    continue
                seen.add(key)
                rows.append(normalized)

    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Merged {len(rows)} unique rows into {output_path}")


if __name__ == "__main__":
    main()
