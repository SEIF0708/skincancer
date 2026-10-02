from __future__ import annotations

import base64
from io import BytesIO
from typing import Tuple

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image

try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False

from .preprocessing import get_eval_transform


class GradCAM:
    """Computes spatial visual heatmaps from Layer4 feature activations in AdvancedResNet50."""

    def __init__(self, model: nn.Module):
        self.model = model
        self.model.eval()
        self.target_layer = self.model.features[7]  # Layer4

        self.activations: torch.Tensor | None = None
        self.gradients: torch.Tensor | None = None

        self.handles = []
        self.handles.append(self.target_layer.register_forward_hook(self._save_activations))
        self.handles.append(self.target_layer.register_full_backward_hook(self._save_gradients))

    def _save_activations(self, module, input, output):
        self.activations = output

    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def generate_heatmap(
        self,
        image: Image.Image,
        device: torch.device,
    ) -> Tuple[np.ndarray, str]:
        """Generates Grad-CAM activation array and returns base64 PNG overlay."""
        if image.mode != "RGB":
            image = image.convert("RGB")
        orig_width, orig_height = image.size

        # Preprocess input image for PyTorch model
        pipeline = __import__("albumentations").Compose(get_eval_transform()["image"])
        transformed = pipeline(image=np.array(image))
        tensor = transformed["image"].unsqueeze(0).to(device)
        tensor.requires_grad = True

        self.model.zero_grad()
        logits = self.model(tensor)
        score = logits[0] if logits.dim() > 0 else logits

        score.backward()

        if self.activations is None or self.gradients is None:
            # Fallback if hooks were not captured
            return np.zeros((orig_height, orig_width)), ""

        activations = self.activations.detach()
        gradients = self.gradients.detach()

        # Channel-wise gradient pooling
        weights = gradients.mean(dim=(2, 3), keepdim=True)
        cam = (weights * activations).sum(dim=1, keepdim=True)
        cam = F.relu(cam)

        # Upsample heatmap to original image dimensions
        cam = F.interpolate(cam, size=(orig_height, orig_width), mode="bilinear", align_corners=False)
        cam_np = cam.squeeze().cpu().numpy()

        # Normalize to [0, 1]
        cam_min, cam_max = cam_np.min(), cam_np.max()
        if cam_max - cam_min > 1e-8:
            norm_cam = (cam_np - cam_min) / (cam_max - cam_min)
        else:
            norm_cam = np.zeros_like(cam_np)

        # Convert to color image heatmap
        if HAS_OPENCV:
            heatmap_uint8 = np.uint8(255 * norm_cam)
            colored_heatmap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
            colored_heatmap = cv2.cvtColor(colored_heatmap, cv2.COLOR_BGR2RGB)
            heatmap_img = Image.fromarray(colored_heatmap)
        else:
            # Simple color mapping fallback using PIL
            r = (norm_cam * 255).astype(np.uint8)
            g = ((1 - np.abs(norm_cam - 0.5) * 2) * 255).astype(np.uint8)
            b = ((1 - norm_cam) * 255).astype(np.uint8)
            color_stack = np.stack([r, g, b], axis=-1)
            heatmap_img = Image.fromarray(color_stack)

        buffered = BytesIO()
        heatmap_img.save(buffered, format="PNG")
        base64_heatmap = f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"

        return norm_cam, base64_heatmap

    def remove_hooks(self):
        for handle in self.handles:
            handle.remove()
