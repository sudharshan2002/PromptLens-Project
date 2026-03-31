"""Evaluate heuristic or linear-manifest scorers on a labeled CSV dataset."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
import sys

import numpy as np


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.schemas import PromptSegmentProfile  # noqa: E402
from app.utils.helpers import estimate_generation_scores  # noqa: E402
from app.utils.prompt_scoring import build_scoring_feature_vector  # noqa: E402


TARGETS = ("trust", "clarity", "quality")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=("heuristic", "manifest-linear"), required=True)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--manifest", default=None, help="Required for manifest-linear mode")
    return parser.parse_args()


def score_manifest(manifest: dict, prompt: str, output: str, mode: str) -> list[float]:
    profile = PromptSegmentProfile(
        object=prompt[:120] or None,
        attributes=[],
        style=[],
        environment=[],
        lighting=[],
        raw_prompt=prompt,
        reference_image_used=False,
    )
    features = build_scoring_feature_vector(
        prompt=prompt,
        output=output,
        mode=mode,
        segment_profile=profile,
        reference_image_used=False,
    )
    scored = []
    for target in TARGETS:
        total = float(manifest["targets"][target]["bias"])
        for feature_name, feature_value in features.items():
            stat = manifest["feature_stats"].get(feature_name, {})
            mean = float(stat.get("mean", 0.0))
            std = float(stat.get("std", 1.0)) or 1.0
            total += ((feature_value - mean) / std) * float(manifest["targets"][target]["weights"].get(feature_name, 0.0))
        scored.append(total)
    return scored


def metric_summary(predictions: np.ndarray, labels: np.ndarray) -> dict[str, float]:
    absolute_errors = np.abs(predictions - labels)
    squared = (predictions - labels) ** 2
    maes = absolute_errors.mean(axis=0)
    rmses = np.sqrt(squared.mean(axis=0))
    output = {
        "trust_mae": float(maes[0]),
        "clarity_mae": float(maes[1]),
        "quality_mae": float(maes[2]),
        "mae_mean": float(maes.mean()),
        "trust_rmse": float(rmses[0]),
        "clarity_rmse": float(rmses[1]),
        "quality_rmse": float(rmses[2]),
        "rmse_mean": float(rmses.mean()),
    }
    return output


def main() -> None:
    args = parse_args()
    manifest = None
    if args.mode == "manifest-linear":
        if not args.manifest:
            raise ValueError("--manifest is required for manifest-linear mode.")
        manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8"))

    predictions = []
    labels = []
    with Path(args.input).open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            prompt = str(row.get("prompt", "")).strip()
            output = str(row.get("output", "")).strip()
            mode = str(row.get("mode", "text") or "text")
            label_row = [float(row[f"{target}_target"]) for target in TARGETS]
            if args.mode == "heuristic":
                prediction_row = list(estimate_generation_scores(prompt, output or prompt, mode))
            else:
                prediction_row = score_manifest(manifest, prompt, output, mode)
            predictions.append(prediction_row)
            labels.append(label_row)

    metrics = metric_summary(np.array(predictions, dtype=np.float64), np.array(labels, dtype=np.float64))
    metrics["model_type"] = args.mode
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Wrote traditional scorer metrics to {output_path}")


if __name__ == "__main__":
    main()
