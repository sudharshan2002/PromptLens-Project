"""Download a Hugging Face dataset split and export it to a local file."""

from __future__ import annotations

import argparse
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", required=True, help="Dataset name, e.g. databricks/databricks-dolly-15k")
    parser.add_argument("--split", default="train", help="Dataset split to export")
    parser.add_argument("--output", required=True, help="Output file path")
    parser.add_argument("--columns", nargs="*", default=None, help="Optional column subset to keep")
    parser.add_argument("--limit", type=int, default=None, help="Optional row limit")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    from datasets import load_dataset

    dataset = load_dataset(args.dataset, split=args.split)
    if args.columns:
        keep = [column for column in args.columns if column in dataset.column_names]
        if keep:
            dataset = dataset.remove_columns([column for column in dataset.column_names if column not in keep])
    if args.limit is not None:
        dataset = dataset.select(range(min(args.limit, len(dataset))))

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    suffix = output_path.suffix.lower()

    if suffix == ".parquet":
        dataset.to_parquet(str(output_path))
    elif suffix == ".csv":
        dataset.to_csv(str(output_path))
    elif suffix == ".jsonl":
        dataset.to_json(str(output_path), lines=True)
    else:
        raise ValueError("Output must end with .parquet, .csv, or .jsonl")

    print(f"Exported {len(dataset)} rows from {args.dataset}:{args.split} to {output_path}")


if __name__ == "__main__":
    main()
