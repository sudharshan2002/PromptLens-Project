"""Export a random subset of segmentation rows for manual review."""

from __future__ import annotations

import argparse
import random
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--sample-size", type=int, default=150)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    rows = [line for line in Path(args.input).read_text(encoding="utf-8").splitlines() if line.strip()]
    if not rows:
        raise ValueError("No rows found in the input JSONL.")

    sample_size = min(args.sample_size, len(rows))
    sampled = random.Random(args.seed).sample(rows, sample_size)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(sampled) + "\n", encoding="utf-8")
    print(f"Wrote {sample_size} segmentation review rows to {output_path}")


if __name__ == "__main__":
    main()
