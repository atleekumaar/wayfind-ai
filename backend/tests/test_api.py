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
    """11. Upload non-image / unsupported format file and expect 400."""
    fake_file = io.BytesIO(b"Hello world not an image")
    response = client.post(
        "/api/v1/analyze",
        files={"image": ("test.txt", fake_file, "text/plain")}
    )
    assert response.status_code == 400
    assert "Unsupported image format" in response.json()["detail"]


def test_analyze_rejects_oversized_image():
    """12. Rejects image exceeding maximum payload limit (10MB)."""
    huge_data = io.BytesIO(b"0" * (11 * 1024 * 1024))
    response = client.post(
        "/api/v1/analyze",
        files={"image": ("huge.jpg", huge_data, "image/jpeg")}
    )
    assert response.status_code == 413
    assert "exceeds maximum allowed size" in response.json()["detail"].lower()


def test_analyze_rejects_empty_image():
    """14. Rejects 0-byte upload with clean error."""
    empty_file = io.BytesIO(b"")
    response = client.post(
        "/api/v1/analyze",
        files={"image": ("empty.jpg", empty_file, "image/jpeg")}
    )
    assert response.status_code == 400


def test_analyze_with_valid_image_returns_evidence_and_uncertainties():
    """13. Upload valid image and verify full Day 2 schema response."""
    img = Image.new("RGB", (160, 160), color=(45, 85, 125))
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
    assert "assessment_confidence" in data
    assert data["assessment_confidence"] in ["HIGH", "MEDIUM", "LOW"]
    assert data["assessment_scope"] == "visible_area_only"
    
    assert "evidence" in data
    assert len(data["evidence"]) > 0
    assert "uncertainties" in data
    assert len(data["uncertainties"]) > 0
    assert "inference_time_ms" in data
    assert "processing_time_ms" in data
