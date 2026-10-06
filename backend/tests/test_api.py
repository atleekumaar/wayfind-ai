import io
from PIL import Image
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify health endpoint response."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "wayfind-ai"
    }


def test_classes_endpoint():
    """Verify supported classes endpoint and model distinction."""
    response = client.get("/api/v1/classes")
    assert response.status_code == 200
    data = response.json()
    assert "classes" in data
    assert "model_supported_classes" in data
    assert "specialized_features_unsupported_by_coco" in data
    assert "stairs" in data["specialized_features_unsupported_by_coco"]


def test_analyze_rejects_unsupported_format():
    """Upload non-image / unsupported format file and expect 400."""
    fake_file = io.BytesIO(b"Hello world not an image")
    response = client.post(
        "/api/v1/analyze",
        files={"image": ("test.txt", fake_file, "text/plain")}
    )
    assert response.status_code == 400
    assert "Unsupported image format" in response.json()["detail"]


def test_analyze_rejects_oversized_image():
    """Rejects image exceeding maximum payload limit (10MB)."""
    huge_data = io.BytesIO(b"0" * (11 * 1024 * 1024))
    response = client.post(
        "/api/v1/analyze",
        files={"image": ("huge.jpg", huge_data, "image/jpeg")}
    )
    assert response.status_code == 413
    assert "exceeds maximum allowed size" in response.json()["detail"].lower()


def test_analyze_rejects_empty_image():
    """Rejects 0-byte upload with clean error."""
    empty_file = io.BytesIO(b"")
    response = client.post(
        "/api/v1/analyze",
        files={"image": ("empty.jpg", empty_file, "image/jpeg")}
    )
    assert response.status_code == 400


def test_analyze_with_profile_query():
    """Analyze with specific accessibility profile."""
    img = Image.new("RGB", (160, 160), color=(45, 85, 125))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    response = client.post(
        "/api/v1/analyze?profile=wheelchair",
        files={"image": ("test.jpg", buf, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["profile"] == "wheelchair"
    assert "speech_summary" in data
    assert "spatial_assessments" in data


def test_analyze_multiview_api_endpoint():
    """Upload 2 images to /api/v1/analyze-multiview and expect fused response."""
    img1 = Image.new("RGB", (160, 160), color=(50, 70, 90))
    buf1 = io.BytesIO()
    img1.save(buf1, format="JPEG")
    buf1.seek(0)

    img2 = Image.new("RGB", (160, 160), color=(90, 70, 50))
    buf2 = io.BytesIO()
    img2.save(buf2, format="JPEG")
    buf2.seek(0)

    response = client.post(
        "/api/v1/analyze-multiview?profile=general_mobility",
        files=[
            ("images", ("view1.jpg", buf1, "image/jpeg")),
            ("images", ("view2.jpg", buf2, "image/jpeg")),
        ]
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["viewpoints_count"] == 2
    assert len(data["individual_analyses"]) == 2
    assert "fused_evidence" in data
    assert "fused_risks" in data


def test_analyze_multiview_rejects_over_three_images():
    """Verify max 3 images limit in /api/v1/analyze-multiview."""
    files = []
    for i in range(4):
        img = Image.new("RGB", (100, 100), color=(i * 20, 50, 50))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)
        files.append(("images", (f"view{i}.jpg", buf, "image/jpeg")))

    response = client.post("/api/v1/analyze-multiview", files=files)
    assert response.status_code == 400
    assert "Maximum of 3 images" in response.json()["detail"]
