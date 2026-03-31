"""Export a random subset of score-label rows for manual review."""

from __future__ import annotations

import argparse
import csv
import random
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--sample-size", type=int, default=250)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--review-sheet", default=None)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    rows = list(csv.DictReader(Path(args.input).open("r", encoding="utf-8-sig", newline="")))
    if not rows:
        raise ValueError("No rows found in the input CSV.")

    sample_size = min(args.sample_size, len(rows))
    sampled = random.Random(args.seed).sample(rows, sample_size)
    fieldnames = list(rows[0].keys())
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(sampled)
    print(f"Wrote {sample_size} score review rows to {output_path}")

    if args.review_sheet:
        review_rows = []
        for row in sampled:
            review_rows.append(
                {
                    "prompt": row.get("prompt", ""),
                    "output": row.get("output", ""),
                    "mode": row.get("mode", ""),
                    "heuristic_trust": row.get("trust_target", ""),
                    "heuristic_clarity": row.get("clarity_target", ""),
                    "heuristic_quality": row.get("quality_target", ""),
                    "gold_trust": "",
                    "gold_clarity": "",
                    "gold_quality": "",
                    "review_notes": "",
                }
            )
        review_fields = [
            "prompt",
            "output",
            "mode",
            "heuristic_trust",
            "heuristic_clarity",
            "heuristic_quality",
            "gold_trust",
            "gold_clarity",
            "gold_quality",
            "review_notes",
        ]
        review_path = Path(args.review_sheet)
        review_path.parent.mkdir(parents=True, exist_ok=True)
        with review_path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=review_fields)
            writer.writeheader()
            writer.writerows(review_rows)
        print(f"Wrote score review sheet to {review_path}")


if __name__ == "__main__":
    main()
