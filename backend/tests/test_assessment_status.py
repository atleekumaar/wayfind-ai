import pytest
from app.schemas.analysis import Detection
from app.services.accessibility import AccessibilityEngine
from app.services.multiview import MultiViewFusionEngine
from PIL import Image


class TestAssessmentStatusAndEvidenceHardening:
    """
    Verification suite for evidence-driven assessment status:
    - Empty detections -> INCONCLUSIVE (Not falsely certified as FULLY_ACCESSIBLE)
    - Unsupported detections only -> INCONCLUSIVE (filtered before scoring)
    - Supported barrier detected -> PRELIMINARY barrier warning
    - Multi-view blank views -> Aggregated assessment status remains INCONCLUSIVE
    - Dual confidence differentiation
    """

    def test_empty_detections_yields_inconclusive(self):
        """Zero detections must yield INCONCLUSIVE, preventing false pass certification."""
        res = AccessibilityEngine.analyze([])
        assert res["score"] == 100
        assert res["assessment_status"] == "INCONCLUSIVE"
        assert res["assessment_confidence"] == "LOW"
        assert "INCONCLUSIVE" in res["summary"]
        assert "inconclusive" in res["speech_summary"].lower()
        assert "insufficient" in res["assessment_status_reason"].lower()

    def test_unsupported_detections_only_filtered_and_inconclusive(self):
        """Unsupported detections must be filtered out and not produce false confidence."""
        unsupported_det = Detection(
            id="det_1_stairs",
            class_name="stairs",
            confidence=0.92,
            bbox=[100.0, 200.0, 300.0, 400.0],
            category="stair_hazard",
            is_model_supported=False,
            detection_status="unsupported",
        )
        res = AccessibilityEngine.analyze([unsupported_det])
        # Filtered out -> effective detections are 0 -> INCONCLUSIVE
        assert res["assessment_status"] == "INCONCLUSIVE"
        assert res["assessment_confidence"] == "LOW"

    def test_supported_barrier_yields_preliminary(self):
        """Supported corridor barrier yields PRELIMINARY warning, not final structural certification."""
        barrier_det = Detection(
            id="det_1_bench",
            class_name="bench",
            confidence=0.88,
            bbox=[260.0, 320.0, 380.0, 440.0],
            category="obstacle",
            is_model_supported=True,
            detection_status="detected",
        )
        res = AccessibilityEngine.analyze([barrier_det], profile="general_mobility")
        assert res["assessment_status"] == "PRELIMINARY"
        assert res["score"] < 100
        assert "Preliminary" in res["summary"]
        assert res["assessment_confidence"] in ["MEDIUM", "HIGH"]

    def test_multi_view_empty_images_remain_inconclusive(self):
        """Multiple empty images must remain INCONCLUSIVE and NOT falsely boost confidence to HIGH."""
        img1 = Image.new("RGB", (640, 480), color=(10, 10, 10))
        img2 = Image.new("RGB", (640, 480), color=(20, 20, 20))
        engine = MultiViewFusionEngine()
        res = engine.analyze_views([img1, img2])
        assert res.assessment_status == "INCONCLUSIVE"
        assert res.assessment_confidence == "LOW"
        assert "INCONCLUSIVE" in res.summary
