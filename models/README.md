# Model Workspace

This project keeps model-related files outside the backend runtime code.

- Put exported backend manifests in `models/frigatescore/manifest.json`
- Put heavy checkpoints in `models/checkpoints/`
- The backend can start without any trained model file and will fall back to heuristics
