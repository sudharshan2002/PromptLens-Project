"""Shared helper functions for tokenization, scoring, and provider helpers."""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from difflib import SequenceMatcher
from typing import Iterable
from urllib.parse import quote, urlencode
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


def estimate_generation_scores(prompt: str, output: str, mode: str) -> tuple[float, float, float]:
    """Estimate confidence-style scores for the UI from prompt/output heuristics."""
    prompt_tokens = tokenize_text(prompt)
    output_tokens = {token.lower() for token in tokenize_text(output)}
    unique_prompt_tokens = {token.lower() for token in prompt_tokens}
    overlap_ratio = (
        len(unique_prompt_tokens & output_tokens) / len(unique_prompt_tokens)
        if unique_prompt_tokens
        else 0.0
    )
    prompt_length_bonus = min(len(prompt.strip()) / 180, 1.0)
    richness_bonus = min(len(unique_prompt_tokens) / 22, 1.0)
    output_length_bonus = min(len(output.strip()) / (220 if mode == "text" else 140), 1.0)

    confidence = 58 + overlap_ratio * 22 + prompt_length_bonus * 12
    clarity = 54 + richness_bonus * 26 + (0.12 if "," in prompt or "." in prompt else 0.0) * 100
    quality = 60 + overlap_ratio * 16 + output_length_bonus * 18 + (4 if mode == "image" else 0)

    return tuple(round(max(0.0, min(score, 99.0)), 2) for score in (confidence, clarity, quality))


def quality_label_from_score(score: float) -> str:
    """Convert a numeric quality score to a short label."""
    if score >= 92:
        return "Excellent"
    if score >= 82:
        return "Good"
    if score >= 70:
        return "Fair"
    return "Needs Work"


def build_pollinations_image_url(
    *,
    prompt: str,
    base_url: str,
    model: str,
    width: int,
    height: int,
    nologo: bool,
) -> str:
    """Build a Pollinations image URL for the supplied prompt."""
    query = urlencode(
        {
            "model": model,
            "width": width,
            "height": height,
            "nologo": "true" if nologo else "false",
        }
    )
    return f"{base_url.rstrip('/')}/{quote(prompt.strip())}?{query}"


def relative_time_from_iso(value: str) -> str:
    """Return a lightweight relative label from an ISO timestamp."""
    created_at = datetime.fromisoformat(value.replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    seconds = max(0, int((now - created_at).total_seconds()))

    if seconds < 60:
        return "just now"
    if seconds < 3600:
        return f"{seconds // 60}m ago"
    if seconds < 86400:
        return f"{seconds // 3600}h ago"
    return f"{seconds // 86400}d ago"


def trim_text(text: str, limit: int = 140) -> str:
    """Trim text without breaking the UI with very long strings."""
    normalized = " ".join(text.split())
    if len(normalized) <= limit:
        return normalized
    return normalized[: limit - 3].rstrip() + "..."


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
