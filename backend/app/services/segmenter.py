"""Prompt segmentation engine with spaCy-first and heuristic fallback behavior."""

from __future__ import annotations

import logging
import re

from app.schemas import PromptSegmentProfile
from app.utils.helpers import dedupe_preserve_order, tokenize_text, trim_text
from config import Settings

logger = logging.getLogger(__name__)

STYLE_KEYWORDS = {
    "cinematic",
    "editorial",
    "minimal",
    "photorealistic",
    "watercolor",
    "3d",
    "retro",
    "futuristic",
    "vintage",
    "luxury",
    "noir",
    "anime",
    "documentary",
    "dramatic",
    "bright",
    "dark",
    "moody",
    "clean",
}
LIGHTING_KEYWORDS = {
    "lighting",
    "sunset",
    "sunrise",
    "golden",
    "neon",
    "backlit",
    "soft",
    "dramatic",
    "studio",
    "daylight",
    "night",
}
ATTRIBUTE_KEYWORDS = {
    "red",
    "blue",
    "green",
    "gold",
    "silver",
    "small",
    "large",
    "floating",
    "transparent",
    "glossy",
    "matte",
    "sleek",
    "detailed",
    "high-resolution",
}
ENVIRONMENT_PREFIXES = ("in ", "on ", "at ", "inside ", "outside ", "under ", "against ", "near ", "beside ")


class PromptSegmenter:
    """Extract object, attributes, style, and environment from a prompt."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._nlp = self._load_spacy_pipeline()

    def segment(self, prompt: str, *, reference_image_used: bool = False) -> PromptSegmentProfile:
        """Segment a prompt into explainable components."""
        normalized = " ".join((prompt or "").split())
        if not normalized and reference_image_used:
            return PromptSegmentProfile(
                object="reference-guided scene",
                raw_prompt="",
                reference_image_used=True,
            )

        if self._nlp is not None and normalized:
            try:
                profile = self._segment_with_spacy(normalized, reference_image_used=reference_image_used)
                if profile.object or profile.attributes or profile.style or profile.environment:
                    return profile
            except Exception as exc:  # pragma: no cover - spaCy path depends on local env
                logger.warning("spaCy segmentation failed, using heuristic fallback: %s", exc)

        return self._segment_heuristically(normalized, reference_image_used=reference_image_used)

    def _segment_with_spacy(self, prompt: str, *, reference_image_used: bool) -> PromptSegmentProfile:
        doc = self._nlp(prompt)
        noun_chunks = [chunk.text.strip(" ,.") for chunk in getattr(doc, "noun_chunks", [])]
        object_text = trim_text(noun_chunks[0], 240) if noun_chunks else None

        attributes: list[str] = []
        style: list[str] = []
        environment: list[str] = []
        lighting: list[str] = []

        for token in doc:
            lowered = token.text.lower()
            if token.pos_ == "ADJ" and token.head.text in (object_text or ""):
                attributes.append(token.text)
            if lowered in STYLE_KEYWORDS:
                style.append(token.text)
            if lowered in LIGHTING_KEYWORDS:
                lighting.append(token.text)
            if lowered in ATTRIBUTE_KEYWORDS:
                attributes.append(token.text)

        for chunk in noun_chunks[1:]:
            lowered = chunk.lower()
            if lowered.startswith(ENVIRONMENT_PREFIXES) or any(prefix in lowered for prefix in ("background", "scene", "landscape")):
                environment.append(chunk)

        for sentence in doc.sents:
            text = sentence.text.strip()
            lowered = text.lower()
            if any(lowered.startswith(prefix) for prefix in ENVIRONMENT_PREFIXES):
                environment.append(text)
            if "style" in lowered:
                style.append(text)

        return PromptSegmentProfile(
            object=object_text or trim_text(prompt, 240),
            attributes=dedupe_preserve_order(attributes),
            style=dedupe_preserve_order(style),
            environment=dedupe_preserve_order(environment),
            lighting=dedupe_preserve_order(lighting),
            raw_prompt=prompt,
            reference_image_used=reference_image_used,
        )

    def _segment_heuristically(self, prompt: str, *, reference_image_used: bool) -> PromptSegmentProfile:
        lowered = prompt.lower()
        clauses = [part.strip(" ,.") for part in re.split(r"[.;,\n]+", prompt) if part.strip(" ,.")]
        tokens = tokenize_text(prompt)

        style = [token for token in tokens if token.lower() in STYLE_KEYWORDS]
        lighting = [token for token in tokens if token.lower() in LIGHTING_KEYWORDS]
        attributes = [token for token in tokens if token.lower() in ATTRIBUTE_KEYWORDS]
        environment = [
            clause for clause in clauses if clause.lower().startswith(ENVIRONMENT_PREFIXES) or "background" in clause.lower()
        ]

        object_text = None
        if clauses:
            first_clause = clauses[0]
            lowered_first = first_clause.lower()
            for prefix in ("with ", "in ", "on ", "at "):
                if lowered_first.startswith(prefix):
                    first_clause = first_clause[len(prefix) :]
                    break
            object_text = trim_text(first_clause, 240)

        if not object_text and prompt:
            object_text = trim_text(" ".join(tokens[:6]), 240)

        if "style" in lowered:
            style.extend(re.findall(r"([a-zA-Z-]+\s+style)", prompt, flags=re.IGNORECASE))

        attribute_phrases = re.findall(r"\b(red|blue|green|gold|silver|sleek|glossy|matte|detailed)\b(?:\s+\w+)?", lowered)
        attributes.extend(attribute_phrases)

        return PromptSegmentProfile(
            object=object_text,
            attributes=dedupe_preserve_order(attributes),
            style=dedupe_preserve_order(style),
            environment=dedupe_preserve_order(environment),
            lighting=dedupe_preserve_order(lighting),
            raw_prompt=prompt,
            reference_image_used=reference_image_used,
        )

    @staticmethod
    def _load_spacy_pipeline():
        try:  # pragma: no cover - optional dependency
            import spacy
        except Exception:
            return None

        for model_name in ("en_core_web_sm", "en_core_web_md", "en_core_web_lg"):
            try:
                return spacy.load(model_name)
            except Exception:
                continue

        try:
            return spacy.blank("en")
        except Exception:
            return None
