import pytest
from app.services.walkable_segmenter import WalkableAreaEstimator
from app.services.route_planner import AccessibleRoutePlanner


class TestWalkableSegmenterAndRoutePlanner:

    def test_walkable_estimator_polygon(self):
        estimator = WalkableAreaEstimator()
        result = estimator.estimate_walkable_area(640, 480)
        assert "polygon_normalized" in result
        assert "polygon_pixel" in result
        assert result["is_fallback"] is True
        assert len(result["polygon_pixel"]) == 4

    def test_box_walkable_overlap_computation(self):
        estimator = WalkableAreaEstimator()
        # Box centered at bottom: [250, 350, 390, 470]
        overlap = estimator.compute_box_walkable_overlap([250.0, 350.0, 390.0, 470.0], 640, 480)
        assert overlap > 0.5

        # Box outside top-left (e.g. sky/building): [10, 20, 100, 150]
        outside_overlap = estimator.compute_box_walkable_overlap([10.0, 20.0, 100.0, 150.0], 640, 480)
        assert outside_overlap == 0.0

    def test_accessible_route_planner_wheelchair_avoids_stairs(self):
        planner = AccessibleRoutePlanner()
        # Wheelchair profile route from entrance_a to concourse
        wc_route = planner.plan_route("node_entrance_a", "node_concourse", profile="wheelchair")
        assert wc_route["success"] is True
        assert wc_route["is_step_free"] is True
        # Should route via ramp, not east steps
        assert "node_accessible_ramp" in wc_route["recommended_route"]
        assert "node_east_steps" not in wc_route["recommended_route"]

    def test_accessible_route_planner_general_takes_shorter_steps(self):
        planner = AccessibleRoutePlanner()
        gen_route = planner.plan_route("node_entrance_a", "node_concourse", profile="general_mobility")
        assert gen_route["success"] is True
        # General mobility profile takes shorter direct stairs (20m + 30m = 50m vs 45m+35m+25m = 105m)
        assert gen_route["total_distance_m"] < 100.0
