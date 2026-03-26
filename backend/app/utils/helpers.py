"""Shared helper functions for tokenization, scoring, and mock outputs."""

from __future__ import annotations

from collections import Counter
from difflib import SequenceMatcher
from typing import Iterable
from urllib.parse import quote
import re
from xml.sax.saxutils import escape

TOKEN_PATTERN = re.compile(r"\b[\w'-]+\b")


def tokenize_text(text: str) -> list[str]:
    """Split freeform text into simple tokens."""
    return TOKEN_PATTERN.findall(text)


def normalize_scores(values: Iterable[float]) -> list[float]:
    """Normalize a list of scores into a stable 0.05-1.00 range."""
    scores = list(values)
    if not scores:
        return []

    minimum = min(scores)
    maximum = max(scores)

    if maximum == minimum:
        return [0.75 for _ in scores]

    return [0.05 + ((score - minimum) / (maximum - minimum)) * 0.95 for score in scores]


def summarize_prompt_difference(original_prompt: str, modified_prompt: str) -> str:
    """Create a compact human-readable summary of prompt edits."""
    original_tokens = tokenize_text(original_prompt)
    modified_tokens = tokenize_text(modified_prompt)

    original_counter = Counter(token.lower() for token in original_tokens)
    modified_counter = Counter(token.lower() for token in modified_tokens)

    added = sorted(token for token in modified_counter if modified_counter[token] > original_counter.get(token, 0))
    removed = sorted(token for token in original_counter if original_counter[token] > modified_counter.get(token, 0))
    similarity = SequenceMatcher(a=original_prompt, b=modified_prompt).ratio()

    parts = [f"Prompt similarity is {similarity:.0%}."]
    if added:
        parts.append(f"Added emphasis on: {', '.join(added[:6])}.")
    if removed:
        parts.append(f"Removed emphasis on: {', '.join(removed[:6])}.")
    if not added and not removed:
        parts.append("The prompts differ mostly in phrasing rather than intent.")

    return " ".join(parts)


def build_mock_text_output(prompt: str) -> str:
    """Return a deterministic text response shaped like a GenAI summary."""
    tokens = tokenize_text(prompt)
    focus_terms = ", ".join(tokens[:5]) if tokens else "the requested concept"
    return (
        "Generated response: This draft expands on "
        f"{focus_terms}. It emphasizes clarity, intent, and a user-facing explanation "
        "that can be inspected in the explainability view."
    )


def build_mock_image_output(prompt: str) -> str:
    """Return a lightweight SVG data URI as a mock image result."""
    safe_prompt = escape(prompt.strip()[:70] or "Untitled prompt")
    svg = f"""
    <svg xmlns='http://www.w3.org/2000/svg' width='768' height='512' viewBox='0 0 768 512'>
      <defs>
        <linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='#0f172a' />
          <stop offset='100%' stop-color='#1d4ed8' />
        </linearGradient>
      </defs>
      <rect width='768' height='512' fill='url(#bg)' rx='32' />
      <text x='48' y='140' fill='white' font-size='32' font-family='Arial, sans-serif'>Mock Image Output</text>
      <text x='48' y='210' fill='#bfdbfe' font-size='22' font-family='Arial, sans-serif'>Prompt:</text>
      <text x='48' y='255' fill='white' font-size='20' font-family='Arial, sans-serif'>{safe_prompt}</text>
      <text x='48' y='330' fill='#cbd5e1' font-size='18' font-family='Arial, sans-serif'>
        Replace this mock with a real image provider when needed.
      </text>
    </svg>
    """.strip()
    return f"data:image/svg+xml;utf8,{quote(svg)}"
