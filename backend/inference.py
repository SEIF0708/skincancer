from __future__ import annotations

from typing import Any

import numpy as np
import torch
from PIL import Image

from .model import AdvancedResNet50, DEVICE, MODEL_VERSION, load_model
from .preprocessing import preprocess_image

CLASSES = ["benign", "malignant"]
DEFAULT_THRESHOLD = 0.50


class SkinCancerPredictor:
    def __init__(self, model_path: str = "backend/models/best_model.pth"):
        self.device = DEVICE
        self.model = AdvancedResNet50()

        state_dict = torch.load(model_path, map_location=self.device, weights_only=True)
        self.model.load_state_dict(state_dict)
        self.model.to(self.device)
        self.model.eval()

    @torch.no_grad()
    def predict(
        self,
        image_array: np.ndarray,
        n_augmentations: int = 5,
        threshold: float = DEFAULT_THRESHOLD,
    ) -> dict[str, Any]:
        all_probs: list[float] = []

        for _ in range(n_augmentations):
            transformed = preprocess_image(image_array, use_tta=True)
            img_tensor = transformed["image"].unsqueeze(0).to(self.device)
            logits = self.model(img_tensor)
            prob = torch.sigmoid(logits).item()
            all_probs.append(prob)

        final_probability = float(np.mean(all_probs))
        prediction = "malignant" if final_probability >= threshold else "benign"

        return {
            "prediction": prediction,
            "probability": final_probability,
            "threshold": threshold,
            "model_version": MODEL_VERSION,
            "tta_iterations": n_augmentations,
        }


def _probability_to_prediction(probability: float, threshold: float) -> str:
    return "malignant" if probability >= threshold else "benign"


def predict_skin_lesion(
    image: Image.Image,
    threshold: float = DEFAULT_THRESHOLD,
    model: torch.nn.Module | None = None,
    use_tta: bool = True,
) -> dict[str, Any]:
    """Apply the notebook-matching TTA pipeline and return the final classification."""
    if model is None:
        model = load_model()

    model.to(DEVICE)
    model.eval()

    if image.mode != "RGB":
        image = image.convert("RGB")
    image_array = np.array(image)

    probabilities: list[float] = []
    for _ in range(5):
        transformed = preprocess_image(image_array, use_tta=use_tta)
        tensor = transformed["image"].unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            logits = model(tensor)
            probability = torch.sigmoid(logits).item()
        probabilities.append(probability)

    final_probability = float(np.mean(probabilities))
    prediction = _probability_to_prediction(final_probability, threshold)
    return {
        "prediction": prediction,
        "probability": round(final_probability, 6),
        "threshold": float(threshold),
        "model_version": MODEL_VERSION,
        "tta_applied": bool(use_tta),
        "tta_iterations": 5,
    }
