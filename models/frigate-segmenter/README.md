# Frigate Segmenter

Store the trained prompt segmentation model in this folder.

Recommended training backbone:

- `distilbert-base-uncased`

Recommended training script:

- `training/models/train_segmenter.py`

Backend behavior:

- if this folder contains a trained token-classification model and the optional runtime NLP dependencies are installed, Frigate will try to load it automatically
- if not, Frigate falls back to the existing spaCy and heuristic segmenter
