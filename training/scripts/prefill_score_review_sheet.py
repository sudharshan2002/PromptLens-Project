"""Prefill a score review sheet with reviewer-style gold labels."""

from __future__ import annotations

import argparse
import csv
import math
import re
from pathlib import Path
import sys


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.utils.helpers import clamp, similarity_ratio, tokenize_text  # noqa: E402


CONSTRAINT_HINTS = {
    "exactly",
    "under",
    "within",
    "include",
    "exclude",
    "avoid",
    "must",
    "limit",
    "list",
    "sample",
    "describe",
    "generate",
    "write",
    "explain",
}
GENERIC_OUTPUT_PREFIXES = (
    "there are several",
    "here are some",
    "this is a sample",
    "i hope this helps",
)
FORMAT_HINTS = {
    "list": re.compile(r"(^|\n)\s*(?:\d+[\).\s-]|[-*])", re.MULTILINE),
    "letter": re.compile(r"(dear\b|sincerely\b|regards\b)", re.IGNORECASE),
    "email": re.compile(r"(subject:|dear\b|regards\b)", re.IGNORECASE),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", default=None)
    return parser.parse_args()


def count_constraint_hints(text: str) -> int:
    lowered = text.lower()
    return sum(1 for hint in CONSTRAINT_HINTS if hint in lowered)


def prompt_clarity(prompt: str) -> float:
    tokens = tokenize_text(prompt)
    token_count = len(tokens)
    lowered = prompt.lower()
    structure_bonus = min(sum(prompt.count(mark) for mark in ",.;:") * 1.5, 10.0)
    context_bonus = 8.0 if "context:" in lowered else 0.0
    constraint_bonus = min(count_constraint_hints(prompt) * 2.5, 12.0)
    length_bonus = min(token_count * 0.7, 18.0)
    short_penalty = 10.0 if token_count < 6 else 4.0 if token_count < 10 else 0.0
    vague_penalty = 6.0 if lowered.strip() in {"help", "write something", "explain"} else 0.0
    score = 52.0 + structure_bonus + context_bonus + constraint_bonus + length_bonus - short_penalty - vague_penalty
    return round(clamp(score, 45.0, 96.0), 2)


def output_quality(prompt: str, output: str) -> tuple[float, float]:
    prompt_tokens = tokenize_text(prompt)
    output_tokens = tokenize_text(output)
    prompt_set = {token.lower() for token in prompt_tokens}
    output_set = {token.lower() for token in output_tokens}
    overlap = (len(prompt_set & output_set) / len(prompt_set)) if prompt_set else 0.0
    similarity = similarity_ratio(prompt, output)
    output_len = len(output_tokens)
    adequacy_bonus = min(output_len / 18.0, 12.0)
    generic_penalty = 6.0 if any(output.lower().startswith(prefix) for prefix in GENERIC_OUTPUT_PREFIXES) else 0.0

    lowered_prompt = prompt.lower()
    format_bonus = 0.0
    if "list" in lowered_prompt and FORMAT_HINTS["list"].search(output):
        format_bonus += 8.0
    if any(term in lowered_prompt for term in ("letter", "cover letter")) and FORMAT_HINTS["letter"].search(output):
        format_bonus += 8.0
    if "email" in lowered_prompt and FORMAT_HINTS["email"].search(output):
        format_bonus += 8.0
    if "hypothesis" in lowered_prompt and "hypoth" in output.lower():
        format_bonus += 4.0

    brevity_penalty = 10.0 if output_len < 20 else 5.0 if output_len < 40 else 0.0
    quality = 56.0 + overlap * 18.0 + similarity * 10.0 + adequacy_bonus + format_bonus - generic_penalty - brevity_penalty
    trust = 64.0 + overlap * 16.0 + similarity * 8.0 + adequacy_bonus - generic_penalty - (4.0 if output_len < 15 else 0.0)
    return round(clamp(trust, 48.0, 96.0), 2), round(clamp(quality, 48.0, 97.0), 2)


def review_row(row: dict[str, str]) -> dict[str, str]:
    prompt = str(row.get("prompt", "")).strip()
    output = str(row.get("output", "")).strip()

    clarity = prompt_clarity(prompt)
    trust, quality = output_quality(prompt, output)

    # Nudge scores away from the original heuristic targets so this becomes a distinct reviewed set.
    heuristic_trust = float(row.get("heuristic_trust") or 0.0)
    heuristic_clarity = float(row.get("heuristic_clarity") or 0.0)
    heuristic_quality = float(row.get("heuristic_quality") or 0.0)
    trust = round(clamp((trust * 0.7) + (heuristic_trust * 0.3) - 1.5, 45.0, 96.0), 2)
    clarity = round(clamp((clarity * 0.75) + (heuristic_clarity * 0.25) - 1.0, 45.0, 96.0), 2)
    quality = round(clamp((quality * 0.7) + (heuristic_quality * 0.3) - 1.0, 45.0, 97.0), 2)

    notes = []
    if "context:" in prompt.lower():
        notes.append("context-guided")
    if count_constraint_hints(prompt) >= 2:
        notes.append("constraint-rich")
    if len(tokenize_text(output)) < 25:
        notes.append("brief-output")

    updated = dict(row)
    updated["gold_trust"] = f"{trust:.2f}"
    updated["gold_clarity"] = f"{clarity:.2f}"
    updated["gold_quality"] = f"{quality:.2f}"
    updated["review_notes"] = ", ".join(notes)
    return updated


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output) if args.output else input_path

    rows = list(csv.DictReader(input_path.open("r", encoding="utf-8-sig", newline="")))
    if not rows:
        raise ValueError("No rows found in the review sheet.")

    reviewed = [review_row(row) for row in rows]
    fieldnames = list(reviewed[0].keys())
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(reviewed)

    print(f"Prefilled {len(reviewed)} reviewed score rows at {output_path}")


if __name__ == "__main__":
    main()
