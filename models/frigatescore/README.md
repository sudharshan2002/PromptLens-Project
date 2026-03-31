# FrigateScore

Place the exported trained manifest at:

`models/frigatescore/manifest.json`

The backend reads this file automatically when `ENABLE_ML_SCORER=true`.

Expected shape:

- `model_name`
- `model_version`
- `feature_stats`
- `targets`
- `metrics`
