"""Compare score-model metric JSON files and write a compact summary."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


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
    keys = sorted(set(baseline.keys()) & set(candidate.keys()))
    comparison = {"baseline": args.baseline, "candidate": args.candidate, "metrics": {}}
    for key in keys:
        if not isinstance(baseline[key], (int, float)) or not isinstance(candidate[key], (int, float)):
            continue
        comparison["metrics"][key] = {
            "baseline": baseline[key],
            "candidate": candidate[key],
            "delta": round(float(candidate[key]) - float(baseline[key]), 6),
        }
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(comparison, indent=2), encoding="utf-8")
    print(f"Wrote score-model comparison to {output_path}")


if __name__ == "__main__":
    main()
