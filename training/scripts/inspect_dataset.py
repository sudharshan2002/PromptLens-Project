"""Inspect a raw public dataset export and print structure and field suggestions.

Datasets used in this project:
  - Stanford Alpaca (tatsu-lab/alpaca)
    Taori, R. et al., 2023. Stanford Alpaca: An instruction-following LLaMA
    model. https://github.com/tatsu-lab/stanford_alpaca

  - Databricks Dolly 15k (databricks/databricks-dolly-15k)
    Conover, M. et al., 2023. Free Dolly: Introducing the world's first
    truly open instruction-tuned LLM.
    https://www.databricks.com/blog/2023/04/12/dolly-first-open-commercially-viable-instruction-tuned-llm
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="Path to a CSV, JSONL, NDJSON, or TXT file")
    parser.add_argument("--limit", type=int, default=25, help="How many rows to inspect")
    return parser.parse_args()


def iter_rows(path: Path):
    suffix = path.suffix.lower()
    if suffix == ".parquet":
        try:
            import pandas as pd
        except Exception as exc:  # pragma: no cover - optional dependency path
            raise RuntimeError("Parquet inspection requires `pandas` and `pyarrow`.") from exc
        frame = pd.read_parquet(path)
        for row in frame.to_dict(orient="records"):
            yield row
        return

    if suffix == ".csv":
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                yield row
        return

    if suffix in {".jsonl", ".ndjson"}:
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                cleaned = line.strip()
                if cleaned:
                    yield json.loads(cleaned)
        return

    if suffix == ".txt":
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                cleaned = line.strip()
                if cleaned:
                    yield {"prompt": cleaned}
        return

    raise ValueError(f"Unsupported input format: {path.suffix}")


def guess_prompt_fields(counter: Counter[str]) -> list[str]:
    preferred = ("prompt", "caption", "text", "instruction", "query", "input")
    return [name for name in preferred if name in counter]


def main() -> None:
    args = parse_args()
    path = Path(args.input)
    key_counter: Counter[str] = Counter()
    samples: list[dict] = []

    for index, row in enumerate(iter_rows(path)):
        if not isinstance(row, dict):
            continue
        key_counter.update(row.keys())
        samples.append(row)
        if index + 1 >= args.limit:
            break

    if not samples:
        raise ValueError("No rows found in the dataset export.")

    print(f"Inspected {len(samples)} rows from {path}")
    print("\nFields seen:")
    for key, count in key_counter.most_common():
        print(f"- {key}: {count}")

    print("\nSuggested prompt-like fields:")
    guesses = guess_prompt_fields(key_counter)
    if guesses:
        for name in guesses:
            print(f"- {name}")
    else:
        print("- No obvious prompt field found automatically")

    print("\nSample rows:")
    for index, row in enumerate(samples[:3], start=1):
        print(f"\nRow {index}:")
        for key, value in row.items():
            shortened = str(value).replace("\n", " ").strip()
            if len(shortened) > 160:
                shortened = shortened[:157] + "..."
            print(f"  {key}: {shortened}")


if __name__ == "__main__":
    main()
