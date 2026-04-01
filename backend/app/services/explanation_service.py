"""Legacy re-export for explainability service."""

from app.services.explainer import ExplainabilityService as ExplanationService
from app.services.explainer import PromptAnalysisResult

__all__ = ["ExplanationService", "PromptAnalysisResult"]
