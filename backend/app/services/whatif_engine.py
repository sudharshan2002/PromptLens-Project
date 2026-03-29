"""Perturbation-based what-if engine for explainable prompt analysis."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass

from app.schemas import PromptSegmentProfile, WhatIfAnalysis, WhatIfVariation
from app.services.generator import GenerationEngine, MultimodalGenerationResult
from app.utils.helpers import clamp, similarity_ratio, trim_text


@dataclass(frozen=True)
class VariationPlan:
    """Internal plan for a prompt perturbation."""

    removed: str
    prompt_variant: str
    explanation: str
    weight: float


class WhatIfEngine:
    """Create prompt variations and compare them with the original output."""

    def __init__(self, generator: GenerationEngine) -> None:
        self.generator = generator

    async def analyze(
        self,
        *,
        prompt: str,
        mode: str,
        segment_profile: PromptSegmentProfile,
        reference_image,
        baseline: MultimodalGenerationResult,
    ) -> WhatIfAnalysis:
        """Run perturbation-based analysis for a single prompt."""
        plans = self._build_variation_plans(prompt=prompt, profile=segment_profile)
        if not plans:
            return WhatIfAnalysis(variations=[], impact_scores={}, mode=mode)

        variation_results = await asyncio.gather(
            *[
                self.generator.generate_mode_bundle(
                    prompt=plan.prompt_variant,
                    mode=mode,
                    reference_image=reference_image,
                )
                for plan in plans
            ]
        )

        baseline_output = (
            baseline.image.analysis_text or baseline.image.output
            if mode == "image"
            else baseline.text.analysis_text or baseline.text.output
        )
        impact_scores: dict[str, float] = {}
        variations: list[WhatIfVariation] = []
        for plan, result in zip(plans, variation_results):
            result_output = (
                result.image.analysis_text or result.image.output
                if mode == "image"
                else result.text.analysis_text or result.text.output
            )
            text_delta = 1.0 - similarity_ratio(baseline_output, result_output)
            prompt_delta = 1.0 - similarity_ratio(prompt, plan.prompt_variant)
            score = round(clamp(plan.weight * 0.5 + text_delta * 0.35 + prompt_delta * 0.15, 0.0, 1.0), 2)
            impact_scores[plan.removed] = round(score * 100, 2)
            variations.append(
                WhatIfVariation(
                    removed=plan.removed,
                    impact=self._impact_label(score),
                    difference=trim_text(
                        f"{plan.explanation} The variant changed the {mode} response by about {round(score * 100)}%.",
                        500,
                    ),
                    prompt_variant=plan.prompt_variant,
                    score=score,
                )
            )

        return WhatIfAnalysis(variations=variations, impact_scores=impact_scores, mode=mode)

    def _build_variation_plans(self, *, prompt: str, profile: PromptSegmentProfile) -> list[VariationPlan]:
        plans: list[VariationPlan] = []
        object_text = (profile.object or "").strip()

        if profile.style:
            plans.append(
                VariationPlan(
                    removed="Style Constraints",
                    prompt_variant=self._rebuild_prompt(profile, drop="style"),
                    explanation="Removing explicit style cues allows the AI's internal priors to take over, which usually results in a more generic or 'default' aesthetic.",
                    weight=0.88,
                )
            )
        if profile.attributes:
            removed_attribute = profile.attributes[0]
            plans.append(
                VariationPlan(
                    removed=f'"{removed_attribute}" Attribute',
                    prompt_variant=self._rebuild_prompt(profile, drop="attribute", value=removed_attribute),
                    explanation=f"Removing the specific attribute '{removed_attribute}' tests how much this descriptor contributes to the final precision and detail of the output.",
                    weight=0.82,
                )
            )
        if profile.environment:
            plans.append(
                VariationPlan(
                    removed="Environment Context",
                    prompt_variant=self._rebuild_prompt(profile, drop="environment"),
                    explanation="Removing the setting or background context shifts the focus entirely to the subject, often changing the perceived 'mood' or grounding of the response.",
                    weight=0.78,
                )
            )
        if not plans and object_text:
            plans.append(
                VariationPlan(
                    removed=object_text,
                    prompt_variant=prompt.replace(object_text, "subject", 1) if object_text in prompt else f"subject {prompt}",
                    explanation="The main object anchor was softened, so focal intent should shift the most.",
                    weight=0.92,
                )
            )

        return plans[:3]

    @staticmethod
    def _rebuild_prompt(profile: PromptSegmentProfile, *, drop: str, value: str | None = None) -> str:
        parts: list[str] = []
        if profile.object:
            parts.append(profile.object)
        if drop != "attribute":
            remaining_attributes = profile.attributes
        else:
            remaining_attributes = [item for item in profile.attributes if item.lower() != (value or "").lower()]
        if remaining_attributes:
            parts.append(", ".join(remaining_attributes))
        if drop != "style" and profile.style:
            parts.append("style: " + ", ".join(profile.style))
        if drop != "environment" and profile.environment:
            parts.append("environment: " + ", ".join(profile.environment))
        if profile.lighting:
            parts.append("lighting: " + ", ".join(profile.lighting))
        if profile.reference_image_used:
            parts.append("Use the attached reference image as a grounding signal")
        rebuilt = ". ".join(part for part in parts if part).strip()
        return rebuilt or "Create a simplified version of the original request."

    @staticmethod
    def _impact_label(score: float) -> str:
        if score >= 0.67:
            return "high"
        if score >= 0.34:
            return "medium"
        return "low"
