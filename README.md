# Skin Cancer Classifier (Streamlit + FastAPI)

This workspace contains a Streamlit frontend (`app.py`) and a FastAPI backend (`api.py`) that loads a PyTorch model (`best_model.pth`).

Quick start (in separate terminals):

1. Start the API server (loads the model):

```bash
python -m uvicorn api:api --reload
```

2. Start the Streamlit frontend:

```bash
streamlit run app.py
```

Notes:

- The Streamlit app will attempt to call `http://localhost:8000/predict` when an image is uploaded and will fall back to manual prediction if the API is unreachable.
- Ensure `best_model.pth` is next to `api.py`.
- Test helper: `tests/test_predict.py` posts a sample image to the running API.
