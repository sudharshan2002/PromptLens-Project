"""Split a CSV dataset into train, validation, and test files."""

from __future__ import annotations

import argparse
import csv
import random
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True)
    parser.add_argument("--train-output", required=True)
    parser.add_argument("--validation-output", required=True)
    parser.add_argument("--test-output", required=True)
    parser.add_argument("--validation-ratio", type=float, default=0.15)
    parser.add_argument("--test-ratio", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def write_rows(path: Path, fieldnames: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    args = parse_args()
    rows = list(csv.DictReader(Path(args.input).open("r", encoding="utf-8-sig", newline="")))
    if not rows:
        raise ValueError("No rows found in the input CSV.")

    random.Random(args.seed).shuffle(rows)
    total = len(rows)
    validation_size = max(1, int(total * args.validation_ratio))
    test_size = max(1, int(total * args.test_ratio))
    test_rows = rows[:test_size]
    validation_rows = rows[test_size : test_size + validation_size]
    train_rows = rows[test_size + validation_size :]
    if not train_rows:
        raise ValueError("Split ratios left no training rows.")

    fieldnames = list(rows[0].keys())
    write_rows(Path(args.train_output), fieldnames, train_rows)
    write_rows(Path(args.validation_output), fieldnames, validation_rows)
    write_rows(Path(args.test_output), fieldnames, test_rows)

    print(f"Train rows: {len(train_rows)}")
    print(f"Validation rows: {len(validation_rows)}")
    print(f"Test rows: {len(test_rows)}")


if __name__ == "__main__":
    main()
