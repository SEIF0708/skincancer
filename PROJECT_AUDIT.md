# PROJECT AUDIT

## CURRENT PROJECT
- Reusable:
  - `best_model.pth` is the only trained model artifact and must remain the source of truth for inference.
  - `api.py` contains a reconstructed ResNet50 + attention model definition, a CPU-safe load path, and a `POST /predict` endpoint.
  - `tests/test_predict.py` is a useful smoke-test template for API validation.
  - The workspace already contains sample lesion images in `scans_images/` for local validation.

- Obsolete:
  - `app.py` is a legacy Streamlit clinical dashboard built around a different workflow and unrelated auth/data model.
  - `db.py` and `clinic.db` are database code for patient records and scans, which is not part of the first V1 inference pipeline.
  - `config.yaml` is an old authentication configuration for the previous Streamlit portal and is not needed for the new dashboard architecture.
  - The README is stale and describes an older demo app rather than the planned AI inference pipeline.

- Broken:
  - The repo does not contain the original notebook or training metadata that would confirm the exact preprocessing, TTA, and threshold selection.
  - The current inference code hard-codes `THRESHOLD = 0.5`, which conflicts with the project requirement of selecting a notebook-verified threshold.
  - The current code resizes/crops to `224`, which does not match the required `528 x 528` inference pipeline.
  - The project is split across competing demo components rather than a single clean application architecture.

- Delete:
  - `app.py`
  - `db.py`
  - `clinic.db`
  - `config.yaml`
  - Any stale dashboard/auth artifacts that are not referenced by the next architecture.

- Keep:
  - `best_model.pth`
  - `api.py` as a starting implementation reference only, but it must be refactored into the new backend structure.
  - `tests/test_predict.py` as a starting point for regression smoke tests.
  - `scans_images/` for validation images.

- Rebuild:
  - A clean backend under `backend/` with `model.py`, `preprocessing.py`, `inference.py`, and a `POST /predict` API.
  - A frontend under `frontend/` using Next.js + TypeScript + Tailwind.
  - A proper README describing the actual notebook-derived architecture, metrics, and limits.

## MODEL STATUS
- The model checkpoint loads successfully in the current environment.
- The architecture reconstructed in `api.py` is consistent with the project description: ResNet50 backbone, avg+max pooling, attention gating, binary head.
- The checkpoint was not cross-checked against the original notebook because no notebook file exists in the repo.
- The threshold and TTA logic are not yet source-of-truth verified and must be recovered from the notebook or the original training artifact before finalizing inference.

## NEXT STEP
- Recover or reconstruct the original notebook/training artifact to confirm the exact preprocessing pipeline, TTA strategy, and chosen threshold.
- Then refactor the repo into the target clean architecture and replace the placeholder threshold with the notebook value.
