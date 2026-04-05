"""Auto-label prompts for segmentation training using the current Frigate segmenter.

Source data derived from:
  - Stanford Alpaca (tatsu-lab/alpaca) — Taori, R. et al., 2023
  - Databricks Dolly 15k (databricks/databricks-dolly-15k) — Conover, M. et al., 2023
"""

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

from app.services.segmenter import PromptSegmenter  # noqa: E402
from app.utils.helpers import tokenize_text  # noqa: E402
from config import get_settings  # noqa: E402


LABELS = ["O", "B-OBJECT", "I-OBJECT", "B-ATTRIBUTE", "I-ATTRIBUTE", "B-STYLE", "I-STYLE", "B-ENVIRONMENT", "I-ENVIRONMENT", "B-LIGHTING", "I-LIGHTING"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="Normalized CSV with a prompt column")
    parser.add_argument("--output", required=True, help="JSONL path for token labels")
    parser.add_argument("--limit", type=int, default=2000)
    return parser.parse_args()


def match_phrase(tokens: list[str], phrase_tokens: list[str], tags: list[str], prefix: str) -> None:
    if not phrase_tokens:
        return
    lowered_tokens = [token.lower() for token in tokens]
    lowered_phrase = [token.lower() for token in phrase_tokens]
    size = len(lowered_phrase)
    for start in range(0, len(lowered_tokens) - size + 1):
        if lowered_tokens[start : start + size] != lowered_phrase:
            continue
        if tags[start] != "O":
            continue
        tags[start] = f"B-{prefix}"
        for index in range(1, size):
            if tags[start + index] == "O":
                tags[start + index] = f"I-{prefix}"
        break


def main() -> None:
    args = parse_args()
    settings = get_settings()
    segmenter = PromptSegmenter(settings)
    input_path = Path(args.input)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    written = 0
    with input_path.open("r", encoding="utf-8-sig", newline="") as handle, output_path.open("w", encoding="utf-8") as destination:
        reader = csv.DictReader(handle)
        for row in reader:
            prompt = str(row.get("prompt", "")).strip()
            if not prompt:
                continue
            profile = segmenter.segment(prompt, reference_image_used=False)
            tokens = tokenize_text(prompt)
            if not tokens:
                continue
            tags = ["O"] * len(tokens)

            if profile.object:
                match_phrase(tokens, tokenize_text(profile.object), tags, "OBJECT")
            for attribute in profile.attributes:
                match_phrase(tokens, tokenize_text(attribute), tags, "ATTRIBUTE")
            for style in profile.style:
                match_phrase(tokens, tokenize_text(style), tags, "STYLE")
            for environment in profile.environment:
                match_phrase(tokens, tokenize_text(environment), tags, "ENVIRONMENT")
            for lighting in profile.lighting:
                match_phrase(tokens, tokenize_text(lighting), tags, "LIGHTING")

            payload = {
                "prompt": prompt,
                "tokens": tokens,
                "tags": tags,
                "mode": str(row.get("mode", "text") or "text"),
            }
            destination.write(json.dumps(payload) + "\n")
            written += 1
            if written >= args.limit:
                break

    print(f"Wrote {written} segmentation label rows to {output_path}")


if __name__ == "__main__":
    main()
