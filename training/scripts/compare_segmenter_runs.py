"""Compare two segmenter metric JSON files and write a compact summary."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


METRICS = ("eval_accuracy", "eval_precision", "eval_recall", "eval_f1", "eval_loss")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline", required=True)
    parser.add_argument("--candidate", required=True)
    parser.add_argument("--output", required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    baseline = json.loads(Path(args.baseline).read_text(encoding="utf-8"))
    candidate = json.loads(Path(args.candidate).read_text(encoding="utf-8"))
    comparison = {"baseline": args.baseline, "candidate": args.candidate, "metrics": {}}
    for metric in METRICS:
        if metric not in baseline or metric not in candidate:
            continue
        comparison["metrics"][metric] = {
            "baseline": baseline[metric],
            "candidate": candidate[metric],
            "delta": round(float(candidate[metric]) - float(baseline[metric]), 6),
        }
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(comparison, indent=2), encoding="utf-8")
    print(f"Wrote segmenter comparison to {output_path}")


if __name__ == "__main__":
    main()
