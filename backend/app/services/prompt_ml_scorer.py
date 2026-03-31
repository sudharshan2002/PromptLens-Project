"""Lightweight trained-score loader with heuristic fallback."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from app.schemas import PromptSegmentProfile, ScoreDetails
from app.utils.helpers import clamp, estimate_generation_scores
from app.utils.prompt_scoring import build_scoring_feature_vector
from config import Settings

logger = logging.getLogger(__name__)


class PromptMLScorer:
    """Use a trained linear manifest when present, otherwise fall back to heuristics."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.manifest_path = Path(settings.ml_model_manifest_path)
        self.regressor_path = Path(settings.ml_score_regressor_model_path)
        self._regressor = self._load_regressor(self.regressor_path) if settings.enable_ml_scorer else None
        self._manifest = self._load_manifest(self.manifest_path) if settings.enable_ml_scorer else None

    def score(
        self,
        *,
        prompt: str,
        output: str,
        mode: str,
        segment_profile: PromptSegmentProfile | None,
        reference_image_used: bool = False,
    ) -> ScoreDetails:
        """Return trust, clarity, and quality scores for the current request."""
        if self._regressor is not None:
            try:
                return self._regressor_score(prompt=prompt)
            except Exception as exc:
                logger.warning("ML score regressor failed, trying manifest fallback: %s", exc)

        if self._manifest is None:
            return self._heuristic_score(prompt=prompt, output=output, mode=mode)

        try:
            features = build_scoring_feature_vector(
                prompt=prompt,
                output=output,
                mode=mode,
                segment_profile=segment_profile,
                reference_image_used=reference_image_used,
            )
            trust = self._score_target("trust", features)
            clarity = self._score_target("clarity", features)
            quality = self._score_target("quality", features)
            return ScoreDetails(
                trust=trust,
                clarity=clarity,
                quality=quality,
                source="manifest-linear",
                model_name=str(self._manifest.get("model_name") or "FrigateScore Linear"),
                model_version=str(self._manifest.get("model_version") or "0.1.0"),
                notes=self._manifest_summary(),
            )
        except Exception as exc:
            logger.warning("ML scorer manifest failed, using heuristics: %s", exc)
            return self._heuristic_score(prompt=prompt, output=output, mode=mode)

    def _score_target(self, target_name: str, features: dict[str, float]) -> float:
        targets = self._manifest.get("targets")
        if not isinstance(targets, dict) or target_name not in targets:
            raise ValueError(f"Missing trained target '{target_name}' in manifest.")

        target = targets[target_name]
        bias = float(target.get("bias", 0.0))
        weights = target.get("weights", {})
        stats = self._manifest.get("feature_stats", {})
        if not isinstance(weights, dict) or not isinstance(stats, dict):
            raise ValueError("Manifest weights or feature_stats are malformed.")

        total = bias
        for feature_name, feature_value in features.items():
            stat = stats.get(feature_name, {})
            mean = float(stat.get("mean", 0.0))
            std = float(stat.get("std", 1.0)) or 1.0
            standardized = (feature_value - mean) / std
            total += standardized * float(weights.get(feature_name, 0.0))

        return round(clamp(total, 0.0, 100.0), 2)

    def _heuristic_score(self, *, prompt: str, output: str, mode: str) -> ScoreDetails:
        trust, clarity, quality = estimate_generation_scores(prompt, output, mode)
        return ScoreDetails(
            trust=trust,
            clarity=clarity,
            quality=quality,
            source="heuristic",
            notes="No trained manifest was found, so Frigate is using the built-in heuristic scorer.",
        )

    def _regressor_score(self, *, prompt: str) -> ScoreDetails:
        tokenizer = self._regressor["tokenizer"]
        model = self._regressor["model"]
        torch = self._regressor["torch"]
        with torch.no_grad():
            encoded = tokenizer(
                prompt,
                truncation=True,
                max_length=192,
                return_tensors="pt",
            )
            output = model(**encoded)
        values = output.logits.squeeze(0).tolist()
        trust, clarity, quality = [round(clamp(float(value), 0.0, 100.0), 2) for value in values]
        return ScoreDetails(
            trust=trust,
            clarity=clarity,
            quality=quality,
            source="transformer-regressor",
            model_name="FrigateScore DistilBERT Regressor",
            model_version="1.0.0",
            notes=f"Loaded from {self.regressor_path}",
        )

    def _manifest_summary(self) -> str | None:
        metrics = self._manifest.get("metrics", {})
        mae = metrics.get("mae", {}) if isinstance(metrics, dict) else {}
        if not isinstance(mae, dict) or not mae:
            return None
        ordered = []
        for label in ("trust", "clarity", "quality"):
            if label in mae:
                ordered.append(f"{label} MAE {float(mae[label]):.2f}")
        return ", ".join(ordered) if ordered else None

    @staticmethod
    def _load_manifest(path: Path) -> dict[str, Any] | None:
        if not path.exists():
            logger.info("ML scorer manifest not found at %s", path)
            return None
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            logger.warning("Unable to read ML scorer manifest %s: %s", path, exc)
            return None
        if not isinstance(payload, dict):
            logger.warning("ML scorer manifest %s is not a JSON object", path)
            return None
        return payload

    @staticmethod
    def _load_regressor(path: Path) -> dict[str, Any] | None:
        if not path.exists():
            logger.info("ML score regressor not found at %s", path)
            return None
        try:  # pragma: no cover - optional dependency
            import torch
            from transformers import AutoModelForSequenceClassification, AutoTokenizer
        except Exception:
            return None

        try:
            tokenizer = AutoTokenizer.from_pretrained(path)
            model = AutoModelForSequenceClassification.from_pretrained(path)
        except Exception as exc:
            logger.warning("Unable to load score regressor from %s: %s", path, exc)
            return None
        model.eval()
        return {"tokenizer": tokenizer, "model": model, "torch": torch}
