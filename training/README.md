# Training Workspace

This folder contains the lightweight training pipeline for a 2-day delivery plan.

Files:

- `requirements.txt`: minimal training dependencies
- `templates/public_labels_template.csv`: labeled-table template
- `scripts/bootstrap_dataset_csv.py`: convert public raw exports into the training CSV shape
- `scripts/train_linear_manifest.py`: train a lightweight custom scorer and export `manifest.json`
- `scripts/evaluate_manifest.py`: evaluate the exported manifest against a labeled CSV

The backend can use the exported manifest immediately without adding PyTorch to runtime.
