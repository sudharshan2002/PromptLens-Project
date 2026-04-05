"""Train a lightweight linear scorer and export a backend manifest.

Training data derived from:
  - Stanford Alpaca (tatsu-lab/alpaca) — Taori, R. et al., 2023
  - Databricks Dolly 15k (databricks/databricks-dolly-15k) — Conover, M. et al., 2023
"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path
import random
import sys
from typing import Iterable

import numpy as np


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.schemas import PromptSegmentProfile  # noqa: E402
from app.utils.prompt_scoring import build_scoring_feature_vector  # noqa: E402


TARGET_NAMES = ("trust", "clarity", "quality")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="Labeled CSV with Frigate training columns")
    parser.add_argument("--output", required=True, help="Path to write manifest.json")
    parser.add_argument("--alpha", type=float, default=0.35, help="Ridge regularization strength")
    parser.add_argument("--validation-ratio", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--model-name", default="FrigateScore Linear")
    parser.add_argument("--model-version", default="0.1.0")
    return parser.parse_args()


def load_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return [row for row in reader]


def float_or_none(value: str | None) -> float | None:
    if value is None:
        return None
    cleaned = str(value).strip()
    if not cleaned:
        return None
    return float(cleaned)


def build_features(rows: Iterable[dict[str, str]]):
    feature_names: list[str] | None = None
    matrix: list[list[float]] = []
    targets: dict[str, list[float]] = {name: [] for name in TARGET_NAMES}

    for row in rows:
        label_values = {
            target: float_or_none(row.get(f"{target}_target"))
            for target in TARGET_NAMES
        }
        if any(value is None for value in label_values.values()):
            continue

        segment_profile = PromptSegmentProfile(
            object=row.get("prompt", "")[:120] or None,
            attributes=[],
            style=[],
            environment=[],
            lighting=[],
            raw_prompt=row.get("prompt", ""),
            reference_image_used=str(row.get("reference_image_used", "0")).strip() in {"1", "true", "yes", "on"},
        )
        features = build_scoring_feature_vector(
            prompt=row.get("prompt", ""),
            output=row.get("output", ""),
            mode=row.get("mode", "text") or "text",
            segment_profile=segment_profile,
            reference_image_used=segment_profile.reference_image_used,
        )

        if feature_names is None:
            feature_names = list(features.keys())
        matrix.append([float(features[name]) for name in feature_names])
        for target, value in label_values.items():
            targets[target].append(float(value))

    if not matrix or feature_names is None:
        raise ValueError("No labeled rows were found. Fill trust_target, clarity_target, and quality_target first.")

    return feature_names, np.array(matrix, dtype=np.float64), {
        target: np.array(values, dtype=np.float64)
        for target, values in targets.items()
    }


def split_indices(count: int, validation_ratio: float, seed: int) -> tuple[list[int], list[int]]:
    indices = list(range(count))
    random.Random(seed).shuffle(indices)
    validation_size = max(1, int(count * validation_ratio))
    validation_indices = indices[:validation_size]
    train_indices = indices[validation_size:] or validation_indices
    return train_indices, validation_indices


def standardize(train_matrix: np.ndarray, validation_matrix: np.ndarray):
    means = train_matrix.mean(axis=0)
    stds = train_matrix.std(axis=0)
    stds = np.where(stds == 0, 1.0, stds)
    return (train_matrix - means) / stds, (validation_matrix - means) / stds, means, stds


def fit_ridge(train_matrix: np.ndarray, train_target: np.ndarray, alpha: float):
    with_bias = np.concatenate([np.ones((train_matrix.shape[0], 1)), train_matrix], axis=1)
    identity = np.eye(with_bias.shape[1], dtype=np.float64)
    identity[0, 0] = 0.0
    weights = np.linalg.solve(with_bias.T @ with_bias + alpha * identity, with_bias.T @ train_target)
    return float(weights[0]), weights[1:]


def predict(matrix: np.ndarray, bias: float, weights: np.ndarray) -> np.ndarray:
    return bias + matrix @ weights


def mae(target: np.ndarray, prediction: np.ndarray) -> float:
    return float(np.mean(np.abs(target - prediction)))


def r2_score(target: np.ndarray, prediction: np.ndarray) -> float:
    centered = target - np.mean(target)
    denominator = float(np.sum(centered ** 2))
    if denominator == 0:
        return 0.0
    return float(1.0 - (np.sum((target - prediction) ** 2) / denominator))


def main() -> None:
    args = parse_args()
    rows = load_rows(Path(args.input))
    feature_names, matrix, targets = build_features(rows)
    train_indices, validation_indices = split_indices(len(matrix), args.validation_ratio, args.seed)

    train_matrix = matrix[train_indices]
    validation_matrix = matrix[validation_indices]
    train_matrix, validation_matrix, means, stds = standardize(train_matrix, validation_matrix)

    manifest = {
        "model_name": args.model_name,
        "model_version": args.model_version,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "feature_stats": {
            name: {"mean": round(float(mean), 8), "std": round(float(std), 8)}
            for name, mean, std in zip(feature_names, means, stds)
        },
        "targets": {},
        "metrics": {
            "samples": {
                "total": int(len(matrix)),
                "train": int(len(train_indices)),
                "validation": int(len(validation_indices)),
            },
            "mae": {},
            "r2": {},
        },
        "training": {
            "alpha": args.alpha,
            "validation_ratio": args.validation_ratio,
            "seed": args.seed,
            "input": str(Path(args.input)),
        },
    }

    for target_name in TARGET_NAMES:
        train_target = targets[target_name][train_indices]
        validation_target = targets[target_name][validation_indices]
        bias, weights = fit_ridge(train_matrix, train_target, args.alpha)
        predictions = predict(validation_matrix, bias, weights)
        manifest["targets"][target_name] = {
            "bias": round(float(bias), 8),
            "weights": {
                name: round(float(weight), 8)
                for name, weight in zip(feature_names, weights)
            },
        }
        manifest["metrics"]["mae"][target_name] = round(mae(validation_target, predictions), 4)
        manifest["metrics"]["r2"][target_name] = round(r2_score(validation_target, predictions), 4)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote trained manifest to {output_path}")


if __name__ == "__main__":
    main()
