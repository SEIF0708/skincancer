from __future__ import annotations

from pathlib import Path

import torch
import torch.nn as nn
from torchvision import models

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_CANDIDATES = [
    BASE_DIR / "backend" / "models" / "best_model.pth",
    BASE_DIR / "best_model.pth",
]
MODEL_VERSION = "resnet50-attention-v1"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class AdvancedResNet50(nn.Module):
    """ResNet50 + attention model reconstructed from the notebook and checkpoint."""

    def __init__(self):
        super().__init__()
        base = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
        self.features = nn.Sequential(*list(base.children())[:-2])

        in_channels = 2048
        self.gap = nn.AdaptiveAvgPool2d(1)
        self.gmp = nn.AdaptiveMaxPool2d(1)

        concat_features = in_channels * 2
        self.attention = nn.Sequential(
            nn.Linear(concat_features, 512),
            nn.ReLU(inplace=True),
            nn.Linear(512, concat_features),
            nn.Sigmoid(),
        )

        self.classifier = nn.Sequential(
            nn.Linear(concat_features, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(256, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        feat = self.features(x)
        gap = self.gap(feat).flatten(1)
        gmp = self.gmp(feat).flatten(1)
        x = torch.cat([gap, gmp], dim=1)

        attn = self.attention(x)
        x = x * attn

        logits = self.classifier(x).squeeze(1)
        return logits


def _resolve_model_path() -> Path:
    for candidate in MODEL_CANDIDATES:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(
        "No saved checkpoint found. Expected best_model.pth under the project root or backend/models/."
    )


def load_model(weights_path: Path | None = None) -> nn.Module:
    if weights_path is None:
        weights_path = _resolve_model_path()

    model = AdvancedResNet50()
    state_dict = torch.load(str(weights_path), map_location="cpu", weights_only=True)
    model.load_state_dict(state_dict)
    model.to(DEVICE)
    model.eval()
    return model
