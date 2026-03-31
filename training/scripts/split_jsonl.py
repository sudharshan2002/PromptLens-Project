"""Split a JSONL dataset into train and validation files."""

from __future__ import annotations

import argparse
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
    rows = [line for line in Path(args.input).read_text(encoding="utf-8").splitlines() if line.strip()]
    if not rows:
        raise ValueError("No rows found in the input JSONL file.")

    random.Random(args.seed).shuffle(rows)
    validation_size = max(1, int(len(rows) * args.validation_ratio))
    validation_rows = rows[:validation_size]
    train_rows = rows[validation_size:] or validation_rows

    train_output = Path(args.train_output)
    validation_output = Path(args.validation_output)
    train_output.parent.mkdir(parents=True, exist_ok=True)
    validation_output.parent.mkdir(parents=True, exist_ok=True)

    train_output.write_text("\n".join(train_rows) + "\n", encoding="utf-8")
    validation_output.write_text("\n".join(validation_rows) + "\n", encoding="utf-8")

    print(f"Train rows: {len(train_rows)}")
    print(f"Validation rows: {len(validation_rows)}")


if __name__ == "__main__":
    main()
