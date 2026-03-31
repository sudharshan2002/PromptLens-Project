"""Build a clean gold score dataset from a reviewed score sheet."""

from __future__ import annotations

import argparse
import csv
import random
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--train-output", default=None)
    parser.add_argument("--validation-output", default=None)
    parser.add_argument("--test-output", default=None)
    parser.add_argument("--validation-ratio", type=float, default=0.2)
    parser.add_argument("--test-ratio", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def normalize_score(value: str) -> float:
    score = float(value)
    if not 0.0 <= score <= 100.0:
        raise ValueError(f"Score out of range 0-100: {value}")
    return round(score, 2)


def write_rows(path: Path, fieldnames: list[str], rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    args = parse_args()
    source_rows = list(csv.DictReader(Path(args.input).open("r", encoding="utf-8-sig", newline="")))
    if not source_rows:
        raise ValueError("No rows found in the review sheet.")

    gold_rows: list[dict[str, object]] = []
    for row in source_rows:
        trust = str(row.get("gold_trust", "")).strip()
        clarity = str(row.get("gold_clarity", "")).strip()
        quality = str(row.get("gold_quality", "")).strip()
        if not (trust and clarity and quality):
            continue
        gold_rows.append(
            {
                "prompt": str(row.get("prompt", "")).strip(),
                "output": str(row.get("output", "")).strip(),
                "mode": str(row.get("mode", "text") or "text").strip(),
                "trust_target": normalize_score(trust),
                "clarity_target": normalize_score(clarity),
                "quality_target": normalize_score(quality),
                "review_notes": str(row.get("review_notes", "")).strip(),
            }
        )

    if not gold_rows:
        raise ValueError("No fully reviewed rows found. Fill gold_trust, gold_clarity, and gold_quality first.")

    fieldnames = list(gold_rows[0].keys())
    write_rows(Path(args.output), fieldnames, gold_rows)
    print(f"Wrote gold score dataset with {len(gold_rows)} rows to {args.output}")

    if args.train_output and args.validation_output and args.test_output:
        rows = list(gold_rows)
        random.Random(args.seed).shuffle(rows)
        total = len(rows)
        validation_size = max(1, int(total * args.validation_ratio))
        test_size = max(1, int(total * args.test_ratio))
        test_rows = rows[:test_size]
        validation_rows = rows[test_size : test_size + validation_size]
        train_rows = rows[test_size + validation_size :]
        if not train_rows:
            raise ValueError("Split ratios left no training rows.")

        write_rows(Path(args.train_output), fieldnames, train_rows)
        write_rows(Path(args.validation_output), fieldnames, validation_rows)
        write_rows(Path(args.test_output), fieldnames, test_rows)
        print(f"Train rows: {len(train_rows)}")
        print(f"Validation rows: {len(validation_rows)}")
        print(f"Test rows: {len(test_rows)}")


if __name__ == "__main__":
    main()
