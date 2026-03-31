"""Evaluate a trained DistilBERT score regressor on a held-out CSV file."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import numpy as np


TARGET_COLUMNS = ("trust_target", "clarity_target", "quality_target")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-dir", required=True)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--max-length", type=int, default=192)
    parser.add_argument("--include-output-text", action="store_true")
    parser.add_argument("--force-cpu", action="store_true")
    return parser.parse_args()


def load_csv(path: Path, *, include_output_text: bool) -> list[dict]:
    rows: list[dict] = []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            prompt = str(row.get("prompt", "")).strip()
            output = str(row.get("output", "")).strip()
            if not prompt:
                continue
            text = prompt if not include_output_text or not output else f"Prompt: {prompt}\nOutput: {output}"
            labels = [float(row[column]) for column in TARGET_COLUMNS]
            rows.append({"text": text, "labels": labels})
    return rows


def detect_use_cpu() -> bool:
    try:
        import torch
    except Exception:
        return True
    return not bool(torch.cuda.is_available())


def compute_metrics(predictions: np.ndarray, labels: np.ndarray) -> dict[str, float]:
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
    for index, name in enumerate(("trust", "clarity", "quality")):
        pred = predictions[:, index]
        gold = labels[:, index]
        output[f"{name}_pearson"] = float(np.corrcoef(pred, gold)[0, 1]) if np.std(pred) and np.std(gold) else 0.0
    output["pearson_mean"] = float(np.mean([output["trust_pearson"], output["clarity_pearson"], output["quality_pearson"]]))
    return output


def main() -> None:
    args = parse_args()

    try:
        from datasets import Dataset
        from transformers import AutoModelForSequenceClassification, AutoTokenizer, DataCollatorWithPadding, Trainer, TrainingArguments
    except Exception as exc:  # pragma: no cover
        raise RuntimeError(
            "Score regressor evaluation requires `transformers`, `datasets`, and `torch`."
        ) from exc

    rows = load_csv(Path(args.input), include_output_text=args.include_output_text)
    tokenizer = AutoTokenizer.from_pretrained(args.model_dir)
    model = AutoModelForSequenceClassification.from_pretrained(args.model_dir)

    def tokenize_batch(batch):
        encoded = tokenizer(batch["text"], truncation=True, max_length=args.max_length)
        encoded["labels"] = batch["labels"]
        return encoded

    dataset = Dataset.from_list(rows).map(tokenize_batch, batched=True)
    trainer = Trainer(
        model=model,
        args=TrainingArguments(
            output_dir=str(Path(args.output).parent / "tmp-score-eval"),
            report_to=[],
            use_cpu=args.force_cpu or detect_use_cpu(),
        ),
        eval_dataset=dataset,
        tokenizer=tokenizer,
        data_collator=DataCollatorWithPadding(tokenizer=tokenizer),
    )
    predictions = trainer.predict(dataset)
    logits = predictions.predictions[0] if isinstance(predictions.predictions, tuple) else predictions.predictions
    labels = predictions.label_ids
    metrics = compute_metrics(np.array(logits, dtype=np.float64), np.array(labels, dtype=np.float64))
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Wrote score regressor metrics to {output_path}")


if __name__ == "__main__":
    main()
