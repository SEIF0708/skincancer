from pathlib import Path

import torch
from fastapi.testclient import TestClient
from PIL import Image

from backend.inference import predict_skin_lesion
from backend.main import app
from backend.model import load_model
from backend.preprocessing import preprocess_image


def test_model_loads_successfully():
    model = load_model()
    assert model is not None
    assert hasattr(model, "features")
    assert hasattr(model, "classifier")


def test_preprocessing_rgb_dimensions_and_normalization():
    image = Image.new("RGBA", (64, 64), (255, 0, 0, 255))
    transformed = preprocess_image(image)
    tensor = transformed["image"]
    assert tensor.shape == (3, 528, 528)
    assert tensor.dtype == torch.float32
    assert tensor.min() >= -3.0
    assert tensor.max() <= 3.0


def test_prediction_returns_valid_result_for_sample_image():
    image_path = Path("scans_images/scan_58c30abcff.jpg")
    assert image_path.exists(), "Sample image missing from scans_images directory"

    image = Image.open(image_path).convert("RGB")
    result = predict_skin_lesion(image)

    assert result["prediction"] in {"benign", "malignant"}
    assert 0.0 <= result["probability"] <= 1.0
    assert result["threshold"] >= 0.0
    assert result["model_version"] == "resnet50-attention-v1"


def test_api_accepts_valid_image():
    client = TestClient(app)
    with open("scans_images/scan_58c30abcff.jpg", "rb") as f:
        response = client.post("/predict", files={"file": ("sample.jpg", f.read(), "image/jpeg")})

    assert response.status_code == 200
    payload = response.json()
    assert payload["prediction"] in {"benign", "malignant"}
    assert 0.0 <= payload["probability"] <= 1.0
    assert payload["model_version"] == "resnet50-attention-v1"


def test_api_rejects_invalid_file_type():
    client = TestClient(app)
    response = client.post("/predict", files={"file": ("bad.txt", b"hello world", "text/plain")})

    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_api_handles_malformed_upload_safely():
    client = TestClient(app)
    response = client.post("/predict", files={"file": ("corrupt.jpg", b"not-a-valid-image", "image/jpeg")})

    assert response.status_code == 400
    assert "Could not decode image" in response.json()["detail"]


def test_signup_creates_doctor_and_returns_token():
    client = TestClient(app)
    payload = {
        "name": "Dr. Maya Chen",
        "email": "maya.chen@clinic.test",
        "password": "SecurePass123!",
        "title": "Consultant Dermatologist",
        "hospital": "Northside Clinic",
    }

    response = client.post("/api/auth/signup", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["doctor"]["email"] == "maya.chen@clinic.test"
    assert body["doctor"]["name"] == "Dr. Maya Chen"
