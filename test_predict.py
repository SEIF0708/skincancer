"""Quick test: send two different images to /api/predict and check results differ."""
import urllib.request
import json
import numpy as np
from PIL import Image
from io import BytesIO

def make_multipart(image_bytes, filename="test.jpg"):
    boundary = "----TestBoundary12345"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode() + image_bytes + f"\r\n--{boundary}--\r\n".encode()
    content_type = f"multipart/form-data; boundary={boundary}"
    return body, content_type

def test_image(seed, label):
    np.random.seed(seed)
    img = Image.fromarray(np.random.randint(0, 255, (528, 528, 3), dtype=np.uint8))
    buf = BytesIO()
    img.save(buf, "JPEG")
    body, ct = make_multipart(buf.getvalue())
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/predict",
        data=body,
        headers={"Content-Type": ct},
    )
    resp = urllib.request.urlopen(req, timeout=60)
    data = json.loads(resp.read().decode())
    print(f"{label}: confidence={data['confidence']}  prediction={data['prediction']}  prob={data['probability']}")

test_image(42, "Image A (seed=42)")
test_image(99, "Image B (seed=99)")
