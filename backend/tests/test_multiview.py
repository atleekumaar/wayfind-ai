import pytest
from PIL import Image
from app.services.multiview import MultiViewFusionEngine
from app.services.analyzer import AccessibilityAnalyzer
from app.schemas.analysis import Detection


def make_test_image(color=(100, 150, 200)):
    return Image.new("RGB", (320, 240), color=color)


class TestMultiViewAnalysis:

    def test_single_view_multiview_analysis(self):
        """G1: Multi-view analysis with 1 image processes and returns unified report."""
        engine = MultiViewFusionEngine()
        img1 = make_test_image((70, 90, 110))
        res = engine.analyze_views([img1])
        assert res.success is True
        assert res.viewpoints_count == 1
        assert len(res.individual_analyses) == 1
        assert 0 <= res.accessibility_score <= 100
        assert "Multi-View" in res.summary

    def test_two_views_evidence_aggregation(self):
        """G2: Multi-view analysis across 2 images combines distinct visual evidence."""
        engine = MultiViewFusionEngine()
        img1 = make_test_image((50, 80, 120))
        img2 = make_test_image((120, 80, 50))
        res = engine.analyze_views([img1, img2])
        assert res.viewpoints_count == 2
        assert len(res.individual_analyses) == 2
        assert res.assessment_confidence == "HIGH"
        assert len(res.fused_evidence) > 0

    def test_three_views_maximum_capacity(self):
        """G3: Multi-view analysis with 3 images completes within bounds."""
        engine = MultiViewFusionEngine()
        imgs = [make_test_image((i * 40, i * 30, i * 50)) for i in range(3)]
        res = engine.analyze_views(imgs)
        assert res.viewpoints_count == 3
        assert len(res.individual_analyses) == 3

    def test_empty_images_raises_value_error(self):
        """G4: Calling analyze_views with empty list raises ValueError."""
        engine = MultiViewFusionEngine()
        with pytest.raises(ValueError):
            engine.analyze_views([])
