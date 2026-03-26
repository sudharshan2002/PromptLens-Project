"""Heuristic explainability logic for prompt token weighting."""

from __future__ import annotations

from collections import Counter

from app.models.schemas import TokenImpact
from app.utils.helpers import normalize_scores, tokenize_text


class ExplanationService:
    """Generate lightweight token impact mappings without a dedicated explainability model."""

    _boost_terms = {
        "style",
        "tone",
        "cinematic",
        "realistic",
        "detailed",
        "summary",
        "analysis",
        "brand",
        "trust",
        "usage",
        "feedback",
        "visual",
        "image",
    }

    def build_token_mapping(self, prompt: str, output: str) -> list[TokenImpact]:
        """Create a deterministic impact score for each prompt token."""
        prompt_tokens = tokenize_text(prompt)
        output_tokens = {token.lower() for token in tokenize_text(output)}

        if not prompt_tokens:
            return []

        counts = Counter(token.lower() for token in prompt_tokens)
        raw_scores: list[float] = []

        for token in prompt_tokens:
            lower_token = token.lower()
            score = 0.2
            score += min(len(token), 12) / 20
            score += 0.15 if lower_token in self._boost_terms else 0.0
            score += 0.2 if lower_token in output_tokens else 0.0
            score += 0.1 if counts[lower_token] == 1 else max(0.0, 0.1 - (counts[lower_token] - 1) * 0.03)
            score += 0.05 if any(char.isdigit() for char in token) else 0.0
            raw_scores.append(score)

        normalized = normalize_scores(raw_scores)
        return [
            TokenImpact(token=token, impact=round(score, 2))
            for token, score in zip(prompt_tokens, normalized)
        ]
