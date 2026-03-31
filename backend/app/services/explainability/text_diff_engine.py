"""Difference analysis for generated text outputs."""

from __future__ import annotations

from dataclasses import dataclass

from app.utils.helpers import clamp, similarity_ratio, tokenize_text, trim_text


@dataclass(frozen=True)
class TextDiffResult:
    score: float
    similarity: float
    prompt_overlap_shift: float
    length_delta: float
    summary: str


class TextDiffEngine:
    """Measure how much a counterfactual prompt changed a generated text output."""

    def compare(self, *, baseline_text: str, candidate_text: str, prompt: str) -> TextDiffResult:
        similarity = similarity_ratio(baseline_text, candidate_text)
        baseline_tokens = {token.lower() for token in tokenize_text(baseline_text)}
        candidate_tokens = {token.lower() for token in tokenize_text(candidate_text)}
        prompt_tokens = {token.lower() for token in tokenize_text(prompt)}

        baseline_overlap = (
            len(prompt_tokens & baseline_tokens) / len(prompt_tokens)
            if prompt_tokens
            else 0.0
        )
        candidate_overlap = (
            len(prompt_tokens & candidate_tokens) / len(prompt_tokens)
            if prompt_tokens
            else 0.0
        )
        overlap_shift = abs(baseline_overlap - candidate_overlap)
        baseline_length = max(1, len(baseline_text.strip()))
        candidate_length = max(1, len(candidate_text.strip()))
        length_delta = abs(candidate_length - baseline_length) / max(baseline_length, candidate_length)
        score = clamp((1.0 - similarity) * 0.58 + overlap_shift * 0.26 + length_delta * 0.16, 0.0, 1.0)

        summary_parts: list[str] = []
        if similarity < 0.65:
            summary_parts.append("The wording and structure changed substantially.")
        elif similarity < 0.82:
            summary_parts.append("The response changed noticeably.")
        else:
            summary_parts.append("The response changed only slightly.")
        if overlap_shift > 0.18:
            summary_parts.append("Prompt-aligned keywords were affected.")
        if length_delta > 0.22:
            summary_parts.append("The response length also shifted.")

        return TextDiffResult(
            score=round(score, 2),
            similarity=round(similarity, 2),
            prompt_overlap_shift=round(overlap_shift, 2),
            length_delta=round(length_delta, 2),
            summary=trim_text(" ".join(summary_parts), 240),
        )
