"""Shared scoring logic for prompt perturbation analysis."""

from __future__ import annotations

from app.utils.helpers import clamp


class CounterfactualEngine:
    """Convert prompt and output deltas into a stable impact score."""

    def score_effect(
        self,
        *,
        plan_weight: float,
        output_delta: float,
        prompt_delta: float,
        secondary_delta: float = 0.0,
    ) -> float:
        return round(
            clamp(
                plan_weight * 0.48 + output_delta * 0.34 + prompt_delta * 0.12 + secondary_delta * 0.06,
                0.0,
                1.0,
            ),
            2,
        )
