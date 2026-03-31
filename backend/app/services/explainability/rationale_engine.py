"""Human-readable explanation generator for prompt impact analysis."""

from __future__ import annotations

from app.utils.helpers import trim_text


class RationaleEngine:
    """Turn measured deltas into concise user-facing rationale strings."""

    def describe_variation(
        self,
        *,
        removed: str,
        mode: str,
        base_explanation: str,
        diff_summary: str,
        score: float,
    ) -> str:
        percent = round(score * 100)
        prefix = f"Removing {removed} changed the {mode} result by about {percent}%."
        return trim_text(f"{prefix} {base_explanation} {diff_summary}", 500)
