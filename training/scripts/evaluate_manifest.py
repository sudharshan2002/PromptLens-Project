"""Evaluate an exported Frigate manifest against a labeled CSV."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
import sys


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.schemas import PromptSegmentProfile  # noqa: E402
from app.utils.prompt_scoring import build_scoring_feature_vector  # noqa: E402


TARGETS = ("trust", "clarity", "quality")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--input", required=True)
    return parser.parse_args()


def float_or_none(value: str | None) -> float | None:
    if value is None:
        return None
    cleaned = str(value).strip()
    if not cleaned:
        return None
    return float(cleaned)


def score_target(manifest: dict, target_name: str, features: dict[str, float]) -> float:
    target = manifest["targets"][target_name]
    total = float(target["bias"])
    for feature_name, feature_value in features.items():
        stat = manifest["feature_stats"].get(feature_name, {})
        mean = float(stat.get("mean", 0.0))
        std = float(stat.get("std", 1.0)) or 1.0
        total += ((feature_value - mean) / std) * float(target["weights"].get(feature_name, 0.0))
    return total


def main() -> None:
    args = parse_args()
    manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8"))

    rows = list(csv.DictReader(Path(args.input).open("r", encoding="utf-8-sig", newline="")))
    errors = {target: [] for target in TARGETS}
    counts = 0

    for row in rows:
        labels = {target: float_or_none(row.get(f"{target}_target")) for target in TARGETS}
        if any(value is None for value in labels.values()):
            continue

        profile = PromptSegmentProfile(
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
            segment_profile=profile,
            reference_image_used=profile.reference_image_used,
        )
        counts += 1
        for target_name in TARGETS:
            prediction = score_target(manifest, target_name, features)
            errors[target_name].append(abs(labels[target_name] - prediction))

    if counts == 0:
        raise ValueError("No labeled rows were found in the evaluation CSV.")

    print(f"Evaluated {counts} labeled rows")
    for target_name in TARGETS:
        average_mae = sum(errors[target_name]) / len(errors[target_name])
        print(f"{target_name}: MAE={average_mae:.4f}")


if __name__ == "__main__":
    main()
