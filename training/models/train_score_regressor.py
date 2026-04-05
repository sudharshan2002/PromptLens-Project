"""Train a DistilBERT regressor for trust, clarity, and quality scores.

Training data derived from:
  - Stanford Alpaca (tatsu-lab/alpaca) — Taori, R. et al., 2023
  - Databricks Dolly 15k (databricks/databricks-dolly-15k) — Conover, M. et al., 2023
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import numpy as np


TARGET_COLUMNS = ("trust_target", "clarity_target", "quality_target")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train", required=True)
    parser.add_argument("--validation", required=True)
    parser.add_argument("--model-name", default="distilbert-base-uncased")
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--epochs", type=int, default=2)
    parser.add_argument("--max-length", type=int, default=192)
    parser.add_argument("--train-batch-size", type=int, default=4)
    parser.add_argument("--eval-batch-size", type=int, default=4)
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
    if not rows:
        raise ValueError(f"No rows found in {path}")
    return rows


def detect_use_cpu() -> bool:
    try:
        import torch
    except Exception:
        return True
    return not bool(torch.cuda.is_available())


def mae_metric(predictions: np.ndarray, labels: np.ndarray) -> dict[str, float]:
    absolute_errors = np.abs(predictions - labels)
    maes = absolute_errors.mean(axis=0)
    return {
        "trust_mae": float(maes[0]),
        "clarity_mae": float(maes[1]),
        "quality_mae": float(maes[2]),
        "mae_mean": float(maes.mean()),
    }


def rmse_metric(predictions: np.ndarray, labels: np.ndarray) -> dict[str, float]:
    squared = (predictions - labels) ** 2
    rmses = np.sqrt(squared.mean(axis=0))
    return {
        "trust_rmse": float(rmses[0]),
        "clarity_rmse": float(rmses[1]),
        "quality_rmse": float(rmses[2]),
        "rmse_mean": float(rmses.mean()),
    }


def correlation_metrics(predictions: np.ndarray, labels: np.ndarray) -> dict[str, float]:
    output: dict[str, float] = {}
    for index, name in enumerate(("trust", "clarity", "quality")):
        pred = predictions[:, index]
        gold = labels[:, index]
        if np.std(pred) == 0 or np.std(gold) == 0:
            output[f"{name}_pearson"] = 0.0
        else:
            output[f"{name}_pearson"] = float(np.corrcoef(pred, gold)[0, 1])
    output["pearson_mean"] = float(np.mean([output["trust_pearson"], output["clarity_pearson"], output["quality_pearson"]]))
    return output


def main() -> None:
    args = parse_args()

    try:
        from datasets import Dataset
        import torch
        from transformers import AutoModelForSequenceClassification, AutoTokenizer, DataCollatorWithPadding, Trainer, TrainingArguments
    except Exception as exc:  # pragma: no cover
        raise RuntimeError(
            "Score regressor training requires `transformers`, `datasets`, and `torch`."
        ) from exc

    train_rows = load_csv(Path(args.train), include_output_text=args.include_output_text)
    validation_rows = load_csv(Path(args.validation), include_output_text=args.include_output_text)

    tokenizer = AutoTokenizer.from_pretrained(args.model_name)
    model = AutoModelForSequenceClassification.from_pretrained(
        args.model_name,
        num_labels=3,
        problem_type="regression",
    )

    def tokenize_batch(batch):
        encoded = tokenizer(batch["text"], truncation=True, max_length=args.max_length)
        encoded["labels"] = batch["labels"]
        return encoded

    train_dataset = Dataset.from_list(train_rows).map(tokenize_batch, batched=True)
    validation_dataset = Dataset.from_list(validation_rows).map(tokenize_batch, batched=True)

    def compute_metrics(eval_pred):
        predictions, labels = eval_pred
        if isinstance(predictions, tuple):
            predictions = predictions[0]
        predictions = np.array(predictions, dtype=np.float64)
        labels = np.array(labels, dtype=np.float64)
        metrics: dict[str, float] = {}
        metrics.update(mae_metric(predictions, labels))
        metrics.update(rmse_metric(predictions, labels))
        metrics.update(correlation_metrics(predictions, labels))
        return metrics

    training_args = TrainingArguments(
        output_dir=args.output_dir,
        do_train=True,
        do_eval=True,
        eval_strategy="epoch",
        save_strategy="epoch",
        logging_strategy="steps",
        logging_steps=50,
        learning_rate=2e-5,
        per_device_train_batch_size=args.train_batch_size,
        per_device_eval_batch_size=args.eval_batch_size,
        num_train_epochs=args.epochs,
        weight_decay=0.01,
        report_to=[],
        use_cpu=args.force_cpu or detect_use_cpu(),
        fp16=bool(torch.cuda.is_available()) and not args.force_cpu,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=validation_dataset,
        tokenizer=tokenizer,
        data_collator=DataCollatorWithPadding(tokenizer=tokenizer),
        compute_metrics=compute_metrics,
    )

    trainer.train()
    metrics = trainer.evaluate()
    trainer.save_model(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    metrics_path = Path(args.output_dir) / "evaluation_metrics.json"
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Saved score regressor model to {args.output_dir}")
    print(f"Saved evaluation metrics to {metrics_path}")


if __name__ == "__main__":
    main()
