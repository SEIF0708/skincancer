from __future__ import annotations

import numpy as np
from PIL import Image

try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False


def extract_abcd_features(image: Image.Image) -> dict[str, float]:
    """Calculates image-based ABCD dermatological clinical features."""
    if image.mode != "RGB":
        image = image.convert("RGB")

    img_np = np.array(image)
    h, w, _ = img_np.shape

    if HAS_OPENCV:
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Otsu thresholding to segment lesion ROI
        _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # Find lesion contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            largest_contour = max(contours, key=cv2.contourArea)
            area = cv2.contourArea(largest_contour)
            perimeter = cv2.arcLength(largest_contour, True)

            # Asymmetry (A): Compare contour mirror overlay across principal axes
            if area > 10:
                mask = np.zeros_like(gray)
                cv2.drawContours(mask, [largest_contour], -1, 255, -1)
                
                flipped_h = cv2.flip(mask, 0)
                flipped_v = cv2.flip(mask, 1)
                
                diff_h = np.logical_xor(mask > 0, flipped_h > 0).sum()
                diff_v = np.logical_xor(mask > 0, flipped_v > 0).sum()
                
                asymmetry_score = min(98.0, max(15.0, ((diff_h + diff_v) / (2.0 * area)) * 100.0))
            else:
                asymmetry_score = 45.0

            # Border Irregularity (B): Compactness / Polsby-Popper ratio
            if area > 10 and perimeter > 0:
                compactness = (perimeter ** 2) / (4 * np.pi * area)
                border_score = min(98.0, max(12.0, (compactness / 3.0) * 50.0))
            else:
                border_score = 40.0

            # Diameter (D): Maximum bounding box dimension
            x, y, bw, bh = cv2.boundingRect(largest_contour)
            max_pixels = max(bw, bh)
            diameter_mm = round(min(14.0, max(2.5, (max_pixels / max(w, h)) * 12.0)), 1)
            diameter_score = min(98.0, max(10.0, (diameter_mm / 10.0) * 100.0))

            # Color Variation (C): Standard deviation across RGB & HSV color spaces
            hsv = cv2.cvtColor(img_np, cv2.COLOR_RGB2HSV)
            mask_bool = mask > 0 if 'mask' in locals() else np.ones((h, w), dtype=bool)
            if mask_bool.any():
                std_r = img_np[:, :, 0][mask_bool].std()
                std_g = img_np[:, :, 1][mask_bool].std()
                std_b = img_np[:, :, 2][mask_bool].std()
                std_h = hsv[:, :, 0][mask_bool].std()
                color_variance = (std_r + std_g + std_b + std_h) / 4.0
                color_score = min(98.0, max(15.0, (color_variance / 40.0) * 100.0))
            else:
                color_score = 50.0

            return {
                "asymmetry": round(asymmetry_score, 1),
                "border": round(border_score, 1),
                "color": round(color_score, 1),
                "diameter": round(diameter_score, 1),
                "diameter_mm": diameter_mm,
            }

    # Fallback if OpenCV is not available or contour extraction fails
    r_std = float(img_np[:, :, 0].std())
    g_std = float(img_np[:, :, 1].std())
    b_std = float(img_np[:, :, 2].std())
    avg_std = (r_std + g_std + b_std) / 3.0

    return {
        "asymmetry": round(min(90.0, max(20.0, avg_std * 1.5)), 1),
        "border": round(min(90.0, max(20.0, avg_std * 1.4)), 1),
        "color": round(min(95.0, max(15.0, avg_std * 1.8)), 1),
        "diameter": round(min(85.0, max(25.0, avg_std * 1.3)), 1),
        "diameter_mm": round(min(12.0, max(3.0, avg_std * 0.15)), 1),
    }
