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
    PENALTY_VEHICLE,
    REWARD_RAMP,
    REWARD_CLEAR_PATH,
)
from app.services.explanation import (
    DeterministicExplanationProvider,
    LLMExplanationProvider,
)


def make_detection(class_name: str, category: str = "general", confidence: float = 0.85):
    return Detection(
        class_name=class_name,
        confidence=confidence,
        bbox=[10.0, 20.0, 100.0, 200.0],
        category=category,
    )


class TestAccessibilityEngineDay2:

    def test_score_bounds_and_clear_path(self):
        """1. Score bounds & reward for confirmed clear scene."""
        res = AccessibilityEngine.analyze([])
        assert res["score"] == 100
        assert res["classification"] == FULLY_ACCESSIBLE
        assert 0 <= res["score"] <= 100

    def test_stairs_penalty(self):
        """2. Stairs penalty applies correctly."""
        stair = make_detection("stairs", category="stair_hazard")
        res = AccessibilityEngine.analyze([stair])
        assert res["score"] == 100 - PENALTY_STAIRS
        assert any(r.type == "STAIRS_BARRIER" for r in res["risks"])

    def test_obstacle_penalty(self):
        """3. Obstacle penalty applies correctly."""
        obs = make_detection("bench", category="obstacle")
        res = AccessibilityEngine.analyze([obs])
        assert res["score"] == 100 - PENALTY_OBSTACLE
        assert any(r.type == "PATHWAY_OBSTACLE" for r in res["risks"])

    def test_vehicle_penalty(self):
        """4. Vehicle proximity penalty applies correctly."""
        veh = make_detection("car", category="vehicle")
        res = AccessibilityEngine.analyze([veh])
        assert res["score"] == 100 - PENALTY_VEHICLE
        assert any(r.type == "VEHICLE_PROXIMITY" for r in res["risks"])

    def test_ramp_positive_evidence(self):
        """5. Ramp positive evidence adds reward."""
        stair = make_detection("stairs", category="stair_hazard")
        ramp = make_detection("ramp", category="accessible_feature")
        res_with = AccessibilityEngine.analyze([stair, ramp])
        res_without = AccessibilityEngine.analyze([stair])
        assert res_with["score"] > res_without["score"]
        # Confirms positive ramp evidence in evidence list
        assert any(e.feature == "Accessible Ramp" and e.status == "detected" for e in res_with["evidence"])

    def test_unknown_ramp_does_not_receive_penalty(self):
        """6. CRITICAL RESPONSIBLE AI RULE: Unseen ramp does NOT penalize."""
        # Clean scene with no ramp detected
        res_empty = AccessibilityEngine.analyze([])
        # Score must remain 100 (not penalized to 80 because a ramp wasn't detected)
        assert res_empty["score"] == 100
        # Ramp is listed as unknown in evidence
        ramp_ev = next(e for e in res_empty["evidence"] if e.feature == "Accessible Ramp")
        assert ramp_ev.status == "unknown"
        assert ramp_ev.source == "unsupported"
        assert any("cannot be determined" in u.lower() for u in res_empty["uncertainties"])

    def test_classification_thresholds(self):
        """7. Classification thresholds map precisely."""
        assert AccessibilityEngine.get_classification(90) == FULLY_ACCESSIBLE
        assert AccessibilityEngine.get_classification(89) == MOSTLY_ACCESSIBLE
        assert AccessibilityEngine.get_classification(70) == MOSTLY_ACCESSIBLE
        assert AccessibilityEngine.get_classification(69) == PARTIALLY_ACCESSIBLE
        assert AccessibilityEngine.get_classification(40) == PARTIALLY_ACCESSIBLE
        assert AccessibilityEngine.get_classification(39) == LIMITED_ACCESSIBILITY
        assert AccessibilityEngine.get_classification(0) == LIMITED_ACCESSIBILITY

    def test_evidence_schema_structure(self):
        """8. Evidence objects conform strictly to typed statuses and sources."""
        stair = make_detection("stairs", category="stair_hazard")
        res = AccessibilityEngine.analyze([stair])
        for ev in res["evidence"]:
            assert ev.status in ["detected", "inferred", "unknown", "not_detected"]
            assert ev.source in [
                "object_detection", "segmentation", "depth_estimation",
                "scene_reasoning", "rule_engine", "unsupported"
            ]

    def test_confidence_calculation(self):
        """9. Assessment confidence scales based on visual coverage."""
        # Many detections -> HIGH confidence
        many = [make_detection("person", category="pedestrian")] * 4
        res_high = AccessibilityEngine.analyze(many)
        assert res_high["assessment_confidence"] == "HIGH"

    def test_unsupported_features_listed_in_uncertainties(self):
        """10. Unsupported features (tactile paving, ADA slope) recorded in uncertainties."""
        res = AccessibilityEngine.analyze([])
        assert any("tactile paving" in u.lower() for u in res["uncertainties"])
        assert any("slope" in u.lower() or "gradient" in u.lower() for u in res["uncertainties"])

    def test_deterministic_explanation_fallback(self):
        """15. Deterministic fallback produces non-empty, grounded insight."""
        provider = DeterministicExplanationProvider()
        out = provider.generate_explanation(
            score=45,
            classification=PARTIALLY_ACCESSIBLE,
            evidence_summary=["stairs: detected"],
            risks_summary=["Stairs detected"],
            uncertainties=["Ramp unknown"],
            base_recommendations=["Look for alternative entrance"],
        )
        assert "ai_insight" in out
        assert "recommended_action" in out
        assert out["provider"] == "deterministic"

    def test_llm_provider_safe_fallback(self):
        """LLM provider safely falls back to deterministic when no API key exists."""
        provider = LLMExplanationProvider("gemini")
        out = provider.generate_explanation(
            score=75,
            classification=MOSTLY_ACCESSIBLE,
            evidence_summary=["clear path: inferred"],
            risks_summary=[],
            uncertainties=["Ramp unknown"],
            base_recommendations=["Verify in person"],
        )
        assert "ai_insight" in out
        assert out["provider"] == "deterministic"
