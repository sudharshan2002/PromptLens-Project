"""Run sample explainability cases through the local app pipeline and save outputs."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import create_app  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cases", default="training/examples/explainability_cases.json")
    parser.add_argument("--output-dir", default="training/artifacts/explainability_cases")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    cases = json.loads(Path(args.cases).read_text(encoding="utf-8"))
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    app = create_app()
    with TestClient(app) as client:
        for case in cases:
            prompt = case["prompt"]
            mode = case["mode"]
            analysis = client.post("/api/analyze", json={"prompt": prompt, "mode": mode})
            generation = client.post(
                "/api/generate",
                json={
                    "prompt": prompt,
                    "mode": mode,
                    "source": "api",
                    "include_multimodal": False,
                    "include_what_if": True,
                    "include_heatmap": False,
                },
            )
            payload = {
                "case": case,
                "analysis": analysis.json(),
                "generation": generation.json(),
            }
            output_path = output_dir / f"{case['id']}.json"
            output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
            print(f"Wrote explainability case to {output_path}")


if __name__ == "__main__":
    main()
