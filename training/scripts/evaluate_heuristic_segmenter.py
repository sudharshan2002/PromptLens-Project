"""Evaluate the heuristic segmenter against BIO-labeled JSONL data."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from seqeval.metrics import accuracy_score, f1_score, precision_score, recall_score  # noqa: E402

from app.services.segmenter import PromptSegmenter  # noqa: E402
from app.utils.helpers import tokenize_text  # noqa: E402
from config import get_settings  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
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


def heuristic_tags(segmenter: PromptSegmenter, prompt: str) -> list[str]:
    profile = segmenter._segment_heuristically(prompt, reference_image_used=False)  # noqa: SLF001
    tokens = tokenize_text(prompt)
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
    return tags


def main() -> None:
    args = parse_args()
    settings = get_settings()
    settings.ml_segmenter_model_path = PROJECT_ROOT / "models" / "__heuristic_only__"
    segmenter = PromptSegmenter(settings)

    true_labels = []
    pred_labels = []
    with Path(args.input).open("r", encoding="utf-8") as handle:
        for line in handle:
            cleaned = line.strip()
            if not cleaned:
                continue
            payload = json.loads(cleaned)
            prompt = payload["prompt"]
            gold = payload["tags"]
            pred = heuristic_tags(segmenter, prompt)
            true_labels.append(gold)
            pred_labels.append(pred)

    metrics = {
        "eval_precision": precision_score(true_labels, pred_labels),
        "eval_recall": recall_score(true_labels, pred_labels),
        "eval_f1": f1_score(true_labels, pred_labels),
        "eval_accuracy": accuracy_score(true_labels, pred_labels),
    }
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Wrote heuristic segmenter metrics to {output_path}")


if __name__ == "__main__":
    main()
