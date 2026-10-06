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
    """Verify supported classes endpoint."""
    response = client.get("/api/v1/classes")
    assert response.status_code == 200
    data = response.json()
    assert "classes" in data
    assert "count" in data


def test_analyze_rejects_unsupported_format():
    """Upload non-image file and expect 400 error."""
    fake_file = io.BytesIO(b"Hello world not an image")
    response = client.post(
        "/api/v1/analyze",
        files={"image": ("test.txt", fake_file, "text/plain")}
    )
    assert response.status_code == 400
    assert "Unsupported image format" in response.json()["detail"]


def test_analyze_with_valid_image():
    """Upload valid test image and expect 200 with structured analysis."""
    # Generate simple 100x100 RGB image
    img = Image.new("RGB", (100, 100), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    response = client.post(
        "/api/v1/analyze",
        files={"image": ("test.jpg", buf, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "accessibility_score" in data
    assert 0 <= data["accessibility_score"] <= 100
    assert "classification" in data
    assert "detections" in data
    assert "risks" in data
    assert "recommendations" in data
    assert "processing_time_ms" in data
