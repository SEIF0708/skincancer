from __future__ import annotations

import numpy as np

IMG_SIZE = 528
NORM_MEAN = (0.485, 0.456, 0.406)
NORM_STD = (0.229, 0.224, 0.225)

try:
    from albumentations import (
        CLAHE,
        CoarseDropout,
        ElasticTransform,
        GaussianBlur,
        GridDistortion,
        HorizontalFlip,
        HueSaturationValue,
        MedianBlur,
        Normalize,
        OneOf,
        OpticalDistortion,
        RandomBrightnessContrast,
        RandomRotate90,
        Resize,
        ShiftScaleRotate,
        Transpose,
        VerticalFlip,
        Compose,
    )
    from albumentations.pytorch import ToTensorV2
    HAS_ALBUMENTATIONS = True
except ImportError:
    HAS_ALBUMENTATIONS = False
    from torchvision import transforms


def get_eval_transform():
    """Standard evaluation transform."""
    if HAS_ALBUMENTATIONS:
        return {
            "image": [
                Resize(IMG_SIZE, IMG_SIZE),
                Normalize(mean=NORM_MEAN, std=NORM_STD),
                ToTensorV2(),
            ]
        }
    else:
        return {
            "image": transforms.Compose([
                transforms.Resize((IMG_SIZE, IMG_SIZE)),
                transforms.ToTensor(),
                transforms.Normalize(mean=NORM_MEAN, std=NORM_STD),
            ])
        }


def get_train_transform():
    """TTA uses full augmentation pipeline when albumentations is available."""
    if HAS_ALBUMENTATIONS:
        return {
            "image": [
                RandomRotate90(p=0.5),
                HorizontalFlip(p=0.5),
                VerticalFlip(p=0.5),
                Transpose(p=0.5),
                ShiftScaleRotate(shift_limit=0.0625, scale_limit=0.1, rotate_limit=45, p=0.5),
                OneOf(
                    [
                        HueSaturationValue(hue_shift_limit=20, sat_shift_limit=30, val_shift_limit=20, p=0.5),
                        RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=0.5),
                        CLAHE(clip_limit=4.0, p=0.5),
                    ],
                    p=0.8,
                ),
                OneOf(
                    [
                        GaussianBlur(blur_limit=(3, 7), p=0.5),
                        MedianBlur(blur_limit=5, p=0.5),
                    ],
                    p=0.4,
                ),
                Resize(IMG_SIZE, IMG_SIZE),
                Normalize(mean=NORM_MEAN, std=NORM_STD),
                ToTensorV2(),
            ]
        }
    else:
        return get_eval_transform()


def preprocess_image(image_array: np.ndarray | object, use_tta: bool = False):
    """Applies evaluation or TTA transform and returns augmented tensor dictionary."""
    if not isinstance(image_array, np.ndarray):
        from PIL import Image
        if hasattr(image_array, "convert"):
            image_array = np.array(image_array.convert("RGB"))
        else:
            image_array = np.array(image_array)

    if HAS_ALBUMENTATIONS:
        transform = get_train_transform() if use_tta else get_eval_transform()
        pipeline = Compose(transform["image"])
        return pipeline(image=image_array)
    else:
        from PIL import Image
        pil_img = Image.fromarray(image_array) if isinstance(image_array, np.ndarray) else image_array
        tensor = get_eval_transform()["image"](pil_img)
        return {"image": tensor}
