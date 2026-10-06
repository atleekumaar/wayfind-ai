import pytest
from app.schemas.analysis import (
    Detection,
    FULLY_ACCESSIBLE,
    MOSTLY_ACCESSIBLE,
    PARTIALLY_ACCESSIBLE,
    LIMITED_ACCESSIBILITY,
)
from app.services.accessibility import (
    AccessibilityEngine,
    THRESHOLD_FULLY_ACCESSIBLE,
    THRESHOLD_MOSTLY_ACCESSIBLE,
    THRESHOLD_PARTIALLY_ACCESSIBLE,
    PENALTY_STAIRS,
    PENALTY_OBSTACLE,
    REWARD_CLEAR_PATH,
)


def make_detection(class_name: str, category: str = "general", confidence: float = 0.85):
    return Detection(
        class_name=class_name,
        confidence=confidence,
        bbox=[10.0, 20.0, 100.0, 200.0],
        category=category,
    )


class TestAccessibilityEngine:
    
    def test_no_risks_high_score(self):
        """TEST 1: No risks should produce a high accessibility score and clear path reward."""
        res = AccessibilityEngine.analyze([])
        assert res["score"] == 100
        assert res["classification"] == FULLY_ACCESSIBLE
        assert len(res["risks"]) == 0
        assert any("No major accessibility barriers" in r.text for r in res["recommendations"])

    def test_stairs_score_decreases(self):
        """TEST 2: Detected stairs should decrease score and generate risk."""
        stair_det = make_detection("stairs", category="stair_hazard")
        res = AccessibilityEngine.analyze([stair_det])
        
        # Base 100 - 25 = 75
        assert res["score"] == 100 - PENALTY_STAIRS
        assert res["classification"] == MOSTLY_ACCESSIBLE
        assert any(r.type == "STAIRS_BARRIER" for r in res["risks"])
        assert any("step-free" in r.text.lower() for r in res["recommendations"])

    def test_stairs_and_obstacle_decreases_further(self):
        """TEST 3: Stairs + obstacle decreases score further."""
        stair_det = make_detection("stairs", category="stair_hazard")
        obs_det = make_detection("bench", category="obstacle")
        
        res_single = AccessibilityEngine.analyze([stair_det])
        res_both = AccessibilityEngine.analyze([stair_det, obs_det])
        
        assert res_both["score"] < res_single["score"]
        assert res_both["score"] == 100 - PENALTY_STAIRS - PENALTY_OBSTACLE
        assert any(r.type == "STAIRS_BARRIER" for r in res_both["risks"])
        assert any(r.type == "PATHWAY_OBSTACLE" for r in res_both["risks"])

    def test_score_never_below_zero(self):
        """TEST 4: Extreme hazards must not drive the score below 0."""
        # 10 stairs, 10 obstacles, 10 vehicles
        hazards = (
            [make_detection("stairs", category="stair_hazard")] * 10
            + [make_detection("chair", category="obstacle")] * 10
            + [make_detection("truck", category="vehicle")] * 10
        )
        res = AccessibilityEngine.analyze(hazards)
        assert res["score"] >= 0
        assert res["score"] <= 100
        assert res["classification"] == LIMITED_ACCESSIBILITY

    def test_score_never_above_100(self):
        """TEST 5: Extreme positive rewards must not drive the score above 100."""
        rewards = [make_detection("ramp", category="accessible_feature")] * 5
        res = AccessibilityEngine.analyze(rewards)
        assert res["score"] <= 100
        assert res["score"] >= 0
        assert res["classification"] == FULLY_ACCESSIBLE

    def test_classification_thresholds_work_correctly(self):
        """TEST 6: Classification thresholds map correctly."""
        assert AccessibilityEngine.get_classification(95) == FULLY_ACCESSIBLE
        assert AccessibilityEngine.get_classification(90) == FULLY_ACCESSIBLE
        assert AccessibilityEngine.get_classification(89) == MOSTLY_ACCESSIBLE
        assert AccessibilityEngine.get_classification(70) == MOSTLY_ACCESSIBLE
        assert AccessibilityEngine.get_classification(69) == PARTIALLY_ACCESSIBLE
        assert AccessibilityEngine.get_classification(40) == PARTIALLY_ACCESSIBLE
        assert AccessibilityEngine.get_classification(39) == LIMITED_ACCESSIBILITY
        assert AccessibilityEngine.get_classification(0) == LIMITED_ACCESSIBILITY

    def test_recommendation_generated_for_stairs(self):
        """TEST 7: Recommendation generated specifically for stairs."""
        stair_det = make_detection("stairs", category="stair_hazard")
        res = AccessibilityEngine.analyze([stair_det])
        
        rec_texts = [r.text for r in res["recommendations"]]
        assert any("step-free" in t.lower() or "ramp" in t.lower() for t in rec_texts)
        assert any(r.priority == "HIGH" for r in res["recommendations"])

    def test_ramp_counterbalances_hazard(self):
        """Test that detecting an accessible ramp provides positive points."""
        stair_det = make_detection("stairs", category="stair_hazard")
        ramp_det = make_detection("ramp", category="accessible_feature")
        
        res_with_ramp = AccessibilityEngine.analyze([stair_det, ramp_det])
        res_without_ramp = AccessibilityEngine.analyze([stair_det])
        
        assert res_with_ramp["score"] > res_without_ramp["score"]
