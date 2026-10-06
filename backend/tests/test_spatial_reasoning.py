import pytest
from app.schemas.analysis import Detection
from app.services.spatial_reasoning import SpatialReasoner


def make_det(class_name: str, bbox: list, conf: float = 0.85):
    return Detection(
        class_name=class_name,
        confidence=conf,
        bbox=bbox,
        category="obstacle" if class_name == "bench" else "vehicle" if class_name == "car" else "general"
    )


class TestSpatialReasoning:

    def test_object_inside_navigation_corridor(self):
        """B1: Object located in central ground region is classified as corridor obstruction."""
        # Central foreground bench: x from 250 to 390 (inside 128 to 512), y from 300 to 450 (lower ground)
        bench = make_det("bench", [250.0, 300.0, 390.0, 450.0])
        results = SpatialReasoner.evaluate([bench], image_dimensions=(640, 480))
        assert len(results) == 1
        assessment = results[0]
        assert assessment.relation_to_path == "inside_navigation_corridor"
        assert assessment.navigation_relevance == "corridor_obstruction"
        assert assessment.overlap_ratio >= 0.30
        assert "potential obstruction" in assessment.explanation.lower()

    def test_object_outside_navigation_corridor_contextual(self):
        """B2: Object far to the side or up in background is classified as contextual."""
        # Car parked on far right edge / upper roadway: x from 550 to 630 (outside 0.80*640=512)
        car = make_det("car", [550.0, 100.0, 630.0, 200.0])
        results = SpatialReasoner.evaluate([car], image_dimensions=(640, 480))
        assert len(results) == 1
        assessment = results[0]
        assert assessment.relation_to_path == "outside_navigation_corridor"
        assert assessment.navigation_relevance == "contextual_outside_corridor"
        assert assessment.overlap_ratio < 0.10

    def test_boundary_case_corridor_edge(self):
        """B3: Object straddling the boundary edge is classified as boundary restriction."""
        # Chair slightly on left boundary: x from 100 to 136 (corridor_x_min is 128, overlap is ~22%)
        chair = make_det("chair", [100.0, 320.0, 136.0, 420.0])
        results = SpatialReasoner.evaluate([chair], image_dimensions=(640, 480))
        assert len(results) == 1
        assessment = results[0]
        assert assessment.relation_to_path == "boundary_corridor"
        assert assessment.navigation_relevance == "pathway_restriction"

    def test_empty_detections_returns_empty_list(self):
        """B4: Empty detections list handled gracefully without exceptions."""
        results = SpatialReasoner.evaluate([], image_dimensions=(640, 480))
        assert results == []

    def test_invalid_and_degenerate_bounding_box(self):
        """B5: Inverted, zero-area, or out-of-bounds coordinates handled defensively."""
        # Inverted box [300, 400, 200, 300]
        inverted = make_det("box", [300.0, 400.0, 200.0, 300.0])
        # Zero area box [100, 100, 100, 100]
        zero_area = make_det("pole", [100.0, 100.0, 100.0, 100.0])
        results = SpatialReasoner.evaluate([inverted, zero_area], image_dimensions=(640, 480))
        assert len(results) == 2
        assert all(r.relation_to_path in ["inside_navigation_corridor", "boundary_corridor", "outside_navigation_corridor"] for r in results)

    def test_missing_image_dimensions_defaults_safely(self):
        """B6: Missing or non-positive dimensions defaults to (640, 480) safely."""
        bench = make_det("bench", [250.0, 300.0, 390.0, 450.0])
        results = SpatialReasoner.evaluate([bench], image_dimensions=None)
        assert len(results) == 1
        assert results[0].relation_to_path == "inside_navigation_corridor"
