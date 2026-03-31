"""Normalize a public dataset export into Frigate's training CSV shape."""

from __future__ import annotations

import argparse
import csv
import json
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
    parser.add_argument("--input", required=True, help="Path to a CSV, JSONL, or TXT export from a public dataset")
    parser.add_argument("--output", required=True, help="Path to the normalized CSV to write")
    parser.add_argument("--prompt-field", default="prompt", help="Column name for prompt text in CSV/JSONL inputs")
    parser.add_argument("--context-field", default=None, help="Optional secondary text column to append to the prompt")
    parser.add_argument("--output-field", default="output", help="Column name for output text when available")
    parser.add_argument("--mode-field", default="mode", help="Column name for mode when available")
    parser.add_argument("--default-mode", default="text", choices=("text", "image"))
    parser.add_argument("--limit", type=int, default=500)
    parser.add_argument("--prefill-heuristics", action="store_true")
    return parser.parse_args()


def iter_rows(path: Path):
    suffix = path.suffix.lower()
    if suffix == ".parquet":
        try:
            import pandas as pd
        except Exception as exc:  # pragma: no cover - optional dependency path
            raise RuntimeError("Parquet conversion requires `pandas` and `pyarrow`.") from exc
        frame = pd.read_parquet(path)
        for row in frame.to_dict(orient="records"):
            yield row
        return

    if suffix == ".csv":
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                yield row
        return

    if suffix in {".jsonl", ".ndjson"}:
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                cleaned = line.strip()
                if not cleaned:
                    continue
                yield json.loads(cleaned)
        return

    if suffix == ".txt":
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                cleaned = line.strip()
                if cleaned:
                    yield {"prompt": cleaned}
        return

    raise ValueError(f"Unsupported input format: {path.suffix}")


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
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()

        for row in iter_rows(input_path):
            prompt = str(row.get(args.prompt_field, "")).strip()
            context = str(row.get(args.context_field, "")).strip() if args.context_field else ""
            if context:
                prompt = f"{prompt}\n\nContext: {context}" if prompt else context
            if not prompt:
                continue

            mode = str(row.get(args.mode_field, args.default_mode)).strip().lower() or args.default_mode
            if mode not in {"text", "image"}:
                mode = args.default_mode

            output_text = str(row.get(args.output_field, "")).strip()
            normalized = {
                "prompt": prompt,
                "mode": mode,
                "output": output_text,
                "reference_image_used": "0",
                "trust_target": "",
                "clarity_target": "",
                "quality_target": "",
            }
            if args.prefill_heuristics:
                trust, clarity, quality = estimate_generation_scores(prompt, output_text or prompt, mode)
                normalized["trust_target"] = str(trust)
                normalized["clarity_target"] = str(clarity)
                normalized["quality_target"] = str(quality)

            writer.writerow(normalized)
            written += 1
            if written >= args.limit:
                break

    print(f"Wrote {written} normalized rows to {output_path}")


if __name__ == "__main__":
    main()
