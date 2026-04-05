"""Evaluate a trained prompt segmenter on a validation JSONL dataset.

Evaluation data derived from:
  - Stanford Alpaca (tatsu-lab/alpaca) — Taori, R. et al., 2023
  - Databricks Dolly 15k (databricks/databricks-dolly-15k) — Conover, M. et al., 2023
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np


LABEL_LIST = ["O", "B-OBJECT", "I-OBJECT", "B-ATTRIBUTE", "I-ATTRIBUTE", "B-STYLE", "I-STYLE", "B-ENVIRONMENT", "I-ENVIRONMENT", "B-LIGHTING", "I-LIGHTING"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-dir", required=True)
    parser.add_argument("--validation", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--force-cpu", action="store_true")
    return parser.parse_args()


def load_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            cleaned = line.strip()
            if cleaned:
                rows.append(json.loads(cleaned))
    return rows


def detect_use_cpu() -> bool:
    try:
        import torch
    except Exception:
        return True
    return not bool(torch.cuda.is_available())


def main() -> None:
    args = parse_args()

    try:
        from datasets import Dataset
        from seqeval.metrics import accuracy_score, f1_score, precision_score, recall_score
        from transformers import AutoModelForTokenClassification, AutoTokenizer, DataCollatorForTokenClassification, Trainer, TrainingArguments
    except Exception as exc:  # pragma: no cover - optional dependency path
        raise RuntimeError(
            "Segmenter evaluation requires `transformers`, `datasets`, `torch`, and `seqeval`."
        ) from exc

    label_to_id = {label: index for index, label in enumerate(LABEL_LIST)}
    tokenizer = AutoTokenizer.from_pretrained(args.model_dir)
    model = AutoModelForTokenClassification.from_pretrained(args.model_dir)
    validation_rows = load_jsonl(Path(args.validation))

    def tokenize_and_align(batch):
        tokenized = tokenizer(batch["tokens"], truncation=True, is_split_into_words=True)
        aligned_labels = []
        for row_index, tags in enumerate(batch["tags"]):
            word_ids = tokenized.word_ids(batch_index=row_index)
            previous_word_id = None
            label_ids = []
            for word_id in word_ids:
                if word_id is None:
                    label_ids.append(-100)
                elif word_id != previous_word_id:
                    label_ids.append(label_to_id[tags[word_id]])
                else:
                    current = tags[word_id]
                    if current.startswith("B-"):
                        current = "I-" + current[2:]
                    label_ids.append(label_to_id.get(current, label_to_id["O"]))
                previous_word_id = word_id
            aligned_labels.append(label_ids)
        tokenized["labels"] = aligned_labels
        return tokenized

    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        predictions = np.argmax(logits, axis=2)
        true_predictions = []
        true_labels = []
        for prediction_row, label_row in zip(predictions, labels):
            filtered_predictions = []
            filtered_labels = []
            for predicted_id, label_id in zip(prediction_row, label_row):
                if label_id == -100:
                    continue
                filtered_predictions.append(LABEL_LIST[int(predicted_id)])
                filtered_labels.append(LABEL_LIST[int(label_id)])
            true_predictions.append(filtered_predictions)
            true_labels.append(filtered_labels)
        return {
            "precision": precision_score(true_labels, true_predictions),
            "recall": recall_score(true_labels, true_predictions),
            "f1": f1_score(true_labels, true_predictions),
            "accuracy": accuracy_score(true_labels, true_predictions),
        }

    validation_dataset = Dataset.from_list(validation_rows).map(tokenize_and_align, batched=True)
    trainer = Trainer(
        model=model,
        args=TrainingArguments(
            output_dir=str(Path(args.output).parent / "tmp-segmenter-eval"),
            report_to=[],
            use_cpu=args.force_cpu or detect_use_cpu(),
        ),
        eval_dataset=validation_dataset,
        tokenizer=tokenizer,
        data_collator=DataCollatorForTokenClassification(tokenizer=tokenizer),
        compute_metrics=compute_metrics,
    )
    metrics = trainer.evaluate()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Wrote evaluation metrics to {output_path}")


if __name__ == "__main__":
    main()
