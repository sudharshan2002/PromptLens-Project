"""Shared prompt-scoring feature extraction used by training and backend inference."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.utils.helpers import clamp, similarity_ratio, tokenize_text

if TYPE_CHECKING:
    from app.schemas import PromptSegmentProfile


STYLE_HINTS = {
    "cinematic",
    "editorial",
    "minimal",
    "photorealistic",
    "watercolor",
    "anime",
    "luxury",
    "documentary",
    "retro",
    "futuristic",
}
CONSTRAINT_HINTS = {
    "must",
    "only",
    "without",
    "avoid",
    "limit",
    "exactly",
    "include",
    "exclude",
}
ENVIRONMENT_HINTS = {
    "background",
    "scene",
    "landscape",
    "room",
    "street",
    "studio",
    "forest",
    "beach",
    "city",
}


def build_scoring_feature_vector(
    *,
    prompt: str,
    output: str,
    mode: str,
    segment_profile: "PromptSegmentProfile | None" = None,
    reference_image_used: bool = False,
) -> dict[str, float]:
    """Build a compact numeric feature vector for lightweight learned scoring."""
    prompt_tokens = tokenize_text(prompt)
    output_tokens = tokenize_text(output)
    prompt_token_set = {token.lower() for token in prompt_tokens}
    output_token_set = {token.lower() for token in output_tokens}
    lowered_prompt = prompt.lower()

    token_count = len(prompt_tokens)
    unique_ratio = (len(prompt_token_set) / token_count) if token_count else 0.0
    avg_token_length = (
        sum(len(token) for token in prompt_tokens) / token_count
        if token_count
        else 0.0
    )
    clause_count = max(1, sum(prompt.count(mark) for mark in ",.;:\n") + (1 if prompt.strip() else 0))
    structure_score = clamp(sum(prompt.count(mark) for mark in ",.;:") / 6, 0.0, 1.0)
    overlap_ratio = (
        len(prompt_token_set & output_token_set) / len(prompt_token_set)
        if prompt_token_set
        else 0.0
    )
    output_similarity = similarity_ratio(prompt, output)

    profile = segment_profile
    attribute_count = len(profile.attributes) if profile else 0
    style_count = len(profile.style) if profile else 0
    environment_count = len(profile.environment) if profile else 0
    lighting_count = len(profile.lighting) if profile else 0

    return {
        "prompt_token_count": clamp(token_count / 80, 0.0, 1.0),
        "prompt_unique_ratio": clamp(unique_ratio, 0.0, 1.0),
        "prompt_avg_token_length": clamp(avg_token_length / 12, 0.0, 1.0),
        "prompt_clause_density": clamp(clause_count / 10, 0.0, 1.0),
        "prompt_structure_score": structure_score,
        "prompt_has_numbers": 1.0 if any(character.isdigit() for character in prompt) else 0.0,
        "prompt_has_style_hint": 1.0 if any(token in lowered_prompt for token in STYLE_HINTS) else 0.0,
        "prompt_has_constraint_hint": 1.0 if any(token in lowered_prompt for token in CONSTRAINT_HINTS) else 0.0,
        "prompt_has_environment_hint": 1.0 if any(token in lowered_prompt for token in ENVIRONMENT_HINTS) else 0.0,
        "segment_object_present": 1.0 if profile and profile.object else 0.0,
        "segment_attribute_count": clamp(attribute_count / 8, 0.0, 1.0),
        "segment_style_count": clamp(style_count / 6, 0.0, 1.0),
        "segment_environment_count": clamp(environment_count / 6, 0.0, 1.0),
        "segment_lighting_count": clamp(lighting_count / 5, 0.0, 1.0),
        "reference_image_used": 1.0 if reference_image_used else 0.0,
        "output_token_count": clamp(len(output_tokens) / 120, 0.0, 1.0),
        "output_prompt_overlap": clamp(overlap_ratio, 0.0, 1.0),
        "output_similarity": clamp(output_similarity, 0.0, 1.0),
        "mode_is_image": 1.0 if mode == "image" else 0.0,
    }
