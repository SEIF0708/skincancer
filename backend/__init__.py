"""Production backend package for the skin-cancer inference pipeline."""

from .inference import predict_skin_lesion
from .model import load_model

__all__ = ["load_model", "predict_skin_lesion"]
