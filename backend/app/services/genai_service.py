"""Backward-compatible generation service imports."""

from app.services.generator import GenerationEngine as GenAIService
from app.services.generator import MultimodalGenerationResult, ProviderGenerationResult

__all__ = ["GenAIService", "MultimodalGenerationResult", "ProviderGenerationResult"]
