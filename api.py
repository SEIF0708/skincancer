"""
Skin Cancer Classifier - FastAPI Backend (Phase 1)
==================================================
Keeps the heavy PyTorch model loaded in memory and exposes a /predict endpoint
for the Streamlit frontend (or any HTTP client).

Architecture (reconstructed from best_model.pth, 338 tensors):
  - Backbone : ResNet50 wrapped as `features` Sequential:
      0: conv1, 1: bn1, 2: relu, 3: maxpool,
      4: layer1 (3x Bottleneck), 5: layer2 (4x),
      6: layer3 (6x), 7: layer4 (3x)
  - Pooling  : AdaptiveAvgPool + AdaptiveMaxPool concatenated -> 4096-d
               (2048 avg + 2048 max)
  - Attention: Linear(4096->512) -> ReLU -> Linear(512->4096) -> Sigmoid,
               applied as channel-wise gating: x = x * attn(x)
  - Head     : Linear(4096->512) -> BN -> ReLU -> Dropout
               -> Linear(512->256) -> BN -> ReLU -> Dropout
               -> Linear(256->1)  (single logit, binary)

Run:
    uvicorn api:api --reload          # as requested (object name is `api`)
    # also works: uvicorn api:app --reload
"""
from pathlib import Path
from io import BytesIO
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision.models import resnet50
from torchvision import transforms
from PIL import Image

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ---------------------------------------------------------------- paths/device
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "best_model.pth"

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

CLASSES = ["benign", "malignant"]  # 0 = benign, 1 = malignant (sigmoid >= 0.5)
THRESHOLD = 0.5
IMG_SIZE = 224

# ------------------------------------------------------------- model definition
class SkinCancerResNet50(nn.Module):
    def __init__(self, dropout_p: float = 0.5):
        super().__init__()
        backbone = resnet50(weights=None)
        self.features = nn.Sequential(
            backbone.conv1,    # 0
            backbone.bn1,      # 1
            backbone.relu,     # 2
            backbone.maxpool,  # 3
            backbone.layer1,   # 4
            backbone.layer2,   # 5
            backbone.layer3,   # 6
            backbone.layer4,   # 7
        )
        self.attention = nn.Sequential(
            nn.Linear(4096, 512),
            nn.ReLU(inplace=True),
            nn.Linear(512, 4096),
            nn.Sigmoid(),
        )
        self.classifier = nn.Sequential(
            nn.Linear(4096, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(p=dropout_p),
            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(inplace=True),
            nn.Dropout(p=dropout_p),
            nn.Linear(256, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        f = self.features(x)                                   # [B, 2048, H, W]
        avg = F.adaptive_avg_pool2d(f, 1).flatten(1)           # [B, 2048]
        mx = F.adaptive_max_pool2d(f, 1).flatten(1)            # [B, 2048]
        c = torch.cat([avg, mx], dim=1)                        # [B, 4096]
        w = self.attention(c)                                  # [B, 4096] gating
        c = c * w
        return self.classifier(c)                              # [B, 1] logits


def load_model(weights_path: Path = MODEL_PATH) -> nn.Module:
    if not weights_path.exists():
        raise FileNotFoundError(
            f"Weights not found at {weights_path}. "
            "Copy best_model.pth next to api.py."
        )
    model = SkinCancerResNet50()
    state = torch.load(str(weights_path), map_location="cpu")
    # weights file is a bare state_dict (OrderedDict of 338 tensors)
    if isinstance(state, dict) and "state_dict" in state:
        state = state["state_dict"]
    model.load_state_dict(state, strict=True)
    model.to(DEVICE)
    model.eval()
    return model


# ------------------------------------------------------------------ preprocessing
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(IMG_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

# ------------------------------------------------------------------ fastapi app
# NOTE: variable is named `api` so `uvicorn api:api --reload` works as requested.
api = FastAPI(
    title="Skin Cancer Classifier API",
    description="ResNet50 + attention backend. POST an image to /predict.",
    version="1.0.0",
)
# alias so `uvicorn api:app` also works
app = api

api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Streamlit frontend runs on a different port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    model = load_model()
    MODEL_ERROR: str | None = None
except Exception as exc:  # keep server up so /health explains the problem
    model = None  # type: ignore
    MODEL_ERROR = str(exc)


def predict_tensor(img: Image.Image) -> dict:
    assert model is not None
    x = preprocess(img.convert("RGB")).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        logit = model(x).squeeze(1)          # [1]
        prob = torch.sigmoid(logit).item()   # P(malignant)
    pred_idx = 1 if prob >= THRESHOLD else 0
    return {
        "prediction": CLASSES[pred_idx],
        "predicted_class": pred_idx,
        "probability": round(prob, 4),                       # P(malignant)
        "malignant_probability": round(prob, 4),
        "benign_probability": round(1.0 - prob, 4),
        "confidence": round(max(prob, 1.0 - prob), 4),
        "threshold": THRESHOLD,
    }


@api.get("/")
def root():
    return {
        "message": "Skin Cancer Classifier API is running",
        "model_loaded": model is not None,
        "device": str(DEVICE),
        "endpoints": {"health": "GET /health", "predict": "POST /predict"},
    }


@api.get("/health")
def health():
    return {
        "status": "ok" if model is not None else "error",
        "model_loaded": model is not None,
        "model_path": str(MODEL_PATH),
        "weights_exist": MODEL_PATH.exists(),
        "device": str(DEVICE),
        "classes": CLASSES,
        "error": MODEL_ERROR,
    }


@api.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail=f"Model not loaded: {MODEL_ERROR}")
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    try:
        raw = await file.read()
        img = Image.open(BytesIO(raw))
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode image file.")
    try:
        result = predict_tensor(img)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}")
    result["filename"] = file.filename
    return JSONResponse(result)
