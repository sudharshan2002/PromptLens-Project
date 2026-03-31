"""Create train and validation CSV splits from a normalized Frigate labels file."""

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
    parser.add_argument("--validation-ratio", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    rows = list(csv.DictReader(input_path.open("r", encoding="utf-8-sig", newline="")))
    if not rows:
        raise ValueError("No rows found in the input CSV.")

    random.Random(args.seed).shuffle(rows)
    validation_size = max(1, int(len(rows) * args.validation_ratio))
    validation_rows = rows[:validation_size]
    train_rows = rows[validation_size:] or validation_rows
    fieldnames = list(rows[0].keys())

    train_output = Path(args.train_output)
    validation_output = Path(args.validation_output)
    train_output.parent.mkdir(parents=True, exist_ok=True)
    validation_output.parent.mkdir(parents=True, exist_ok=True)

    with train_output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(train_rows)

    with validation_output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(validation_rows)

    print(f"Train rows: {len(train_rows)}")
    print(f"Validation rows: {len(validation_rows)}")


if __name__ == "__main__":
    main()
