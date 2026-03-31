"""Build a cleaner scoring dataset from normalized prompts for trust, clarity, and quality prediction."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path
import sys


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.utils.helpers import estimate_generation_scores  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--limit", type=int, default=5000)
    parser.add_argument("--overwrite-targets", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "prompt",
        "mode",
        "output",
        "reference_image_used",
        "trust_target",
        "clarity_target",
        "quality_target",
    ]

    written = 0
    with input_path.open("r", encoding="utf-8-sig", newline="") as source, output_path.open("w", encoding="utf-8", newline="") as destination:
        reader = csv.DictReader(source)
        writer = csv.DictWriter(destination, fieldnames=fieldnames)
        writer.writeheader()

        for row in reader:
            prompt = str(row.get("prompt", "")).strip()
            if not prompt:
                continue
            mode = str(row.get("mode", "text") or "text").strip().lower() or "text"
            output = str(row.get("output", "")).strip()
            trust = str(row.get("trust_target", "")).strip()
            clarity = str(row.get("clarity_target", "")).strip()
            quality = str(row.get("quality_target", "")).strip()

            if args.overwrite_targets or not (trust and clarity and quality):
                heuristic = estimate_generation_scores(prompt, output or prompt, mode)
                trust, clarity, quality = (str(value) for value in heuristic)

            writer.writerow(
                {
                    "prompt": prompt,
                    "mode": mode,
                    "output": output,
                    "reference_image_used": str(row.get("reference_image_used", "0")).strip() or "0",
                    "trust_target": trust,
                    "clarity_target": clarity,
                    "quality_target": quality,
                }
            )
            written += 1
            if written >= args.limit:
                break

    print(f"Wrote {written} scoring rows to {output_path}")


if __name__ == "__main__":
    main()
