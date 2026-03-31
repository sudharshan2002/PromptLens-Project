"""Split a JSONL dataset into train, validation, and test files."""

from __future__ import annotations

import argparse
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


def write_lines(path: Path, rows: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(rows) + "\n", encoding="utf-8")


def main() -> None:
    args = parse_args()
    rows = [line for line in Path(args.input).read_text(encoding="utf-8").splitlines() if line.strip()]
    if not rows:
        raise ValueError("No rows found in the input JSONL file.")

    random.Random(args.seed).shuffle(rows)
    total = len(rows)
    validation_size = max(1, int(total * args.validation_ratio))
    test_size = max(1, int(total * args.test_ratio))
    test_rows = rows[:test_size]
    validation_rows = rows[test_size : test_size + validation_size]
    train_rows = rows[test_size + validation_size :]
    if not train_rows:
        raise ValueError("Split ratios left no training rows.")

    write_lines(Path(args.train_output), train_rows)
    write_lines(Path(args.validation_output), validation_rows)
    write_lines(Path(args.test_output), test_rows)

    print(f"Train rows: {len(train_rows)}")
    print(f"Validation rows: {len(validation_rows)}")
    print(f"Test rows: {len(test_rows)}")


if __name__ == "__main__":
    main()
