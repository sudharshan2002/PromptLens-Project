"""Backward-compatible explainability service imports."""

from app.services.explainer import ExplainabilityService as ExplanationService
from app.services.explainer import PromptAnalysisResult

__all__ = ["ExplanationService", "PromptAnalysisResult"]
