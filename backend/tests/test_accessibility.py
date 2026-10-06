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
    PROFILE_WEIGHTS,
)
from app.services.explanation import (
    DeterministicExplanationProvider,
    LLMExplanationProvider,
)


def make_detection(
    class_name: str,
    category: str = "general",
    confidence: float = 0.85,
    bbox: list = None,
):
    # Default to central corridor bbox: [250, 300, 390, 450]
    return Detection(
        class_name=class_name,
        confidence=confidence,
        bbox=bbox or [250.0, 300.0, 390.0, 450.0],
        category=category,
    )


class TestAccessibilityEngineHardening:

    def test_score_bounds_and_clear_path(self):
        """A1: Score bounds & reward for confirmed clear scene."""
        res = AccessibilityEngine.analyze([])
        assert res["score"] == 100
        assert res["classification"] == FULLY_ACCESSIBLE
        assert 0 <= res["score"] <= 100

    def test_stairs_penalty_general_profile(self):
        """A2: Stairs penalty applies correctly for general profile."""
        stair = make_detection("stairs", category="stair_hazard")
        res = AccessibilityEngine.analyze([stair], profile="general_mobility")
        assert res["score"] == 100 - PROFILE_WEIGHTS["general_mobility"]["stairs"]
        assert any(r.type == "STAIRS_BARRIER" for r in res["risks"])

    def test_profile_wheelchair_heavier_stair_penalty(self):
        """C1: Wheelchair profile penalizes stairs more severely than general mobility."""
        stair = make_detection("stairs", category="stair_hazard")
        res_wheelchair = AccessibilityEngine.analyze([stair], profile="wheelchair")
        res_general = AccessibilityEngine.analyze([stair], profile="general_mobility")
        
        # Wheelchair: -35 pts; General: -25 pts
        assert res_wheelchair["score"] < res_general["score"]
        assert res_wheelchair["score"] == 100 - PROFILE_WEIGHTS["wheelchair"]["stairs"]
        assert any(r.severity == "CRITICAL" for r in res_wheelchair["risks"])

    def test_profile_low_vision_heavier_obstacle_penalty(self):
        """C2: Low vision profile penalizes corridor obstacles more heavily."""
        obs = make_detection("bench", category="obstacle")
        res_low_vision = AccessibilityEngine.analyze([obs], profile="low_vision")
        res_general = AccessibilityEngine.analyze([obs], profile="general_mobility")
        assert res_low_vision["score"] < res_general["score"]

    def test_contextual_obstacle_outside_corridor_no_penalty(self):
        """B1 & Phase 3: Obstacle far away from the navigation corridor receives 0 penalty!"""
        # Obstacle placed in far top-left: x from 10 to 60, y from 50 to 90
        far_bench = make_detection("bench", category="obstacle", bbox=[10.0, 50.0, 60.0, 90.0])
        res = AccessibilityEngine.analyze([far_bench], image_dimensions=(640, 480))
        # Base 100 with clear path reward = 100, no obstacle deduction!
        assert res["score"] == 100
        assert res["breakdown"].penalties == 0
        assert any("outside corridor" in f.lower() for f in res["breakdown"].factors)

    def test_corridor_obstacle_receives_penalty(self):
        """B2 & Phase 3: Obstacle directly in central pedestrian corridor receives penalty."""
        center_bench = make_detection("bench", category="obstacle", bbox=[260.0, 320.0, 380.0, 440.0])
        res = AccessibilityEngine.analyze([center_bench], image_dimensions=(640, 480))
        assert res["score"] < 100
        assert res["breakdown"].penalties > 0

    def test_contextual_vehicle_outside_path_no_penalty(self):
        """B3 & Phase 3: Vehicle far on roadway receives 0 penalty."""
        road_car = make_detection("car", category="vehicle", bbox=[550.0, 80.0, 630.0, 160.0])
        res = AccessibilityEngine.analyze([road_car], image_dimensions=(640, 480))
        assert res["breakdown"].penalties == 0

    def test_ramp_positive_evidence_improves_score(self):
        """A3: Ramp positive evidence adds reward points."""
        stair = make_detection("stairs", category="stair_hazard")
        ramp = make_detection("ramp", category="accessible_feature")
        res_with = AccessibilityEngine.analyze([stair, ramp])
        res_without = AccessibilityEngine.analyze([stair])
        assert res_with["score"] > res_without["score"]
        assert any(e.feature == "Accessible Ramp" and e.status == "detected" for e in res_with["evidence"])

    def test_unknown_ramp_does_not_receive_penalty(self):
        """E1: Absence of visual evidence for a ramp receives 0 penalty points."""
        res_empty = AccessibilityEngine.analyze([])
        assert res_empty["score"] == 100
        ramp_ev = next(e for e in res_empty["evidence"] if e.feature == "Accessible Ramp")
        assert ramp_ev.status == "unknown"
        assert ramp_ev.source == "unsupported"

    def test_classification_thresholds(self):
        """A4: Classification thresholds map correctly."""
        assert AccessibilityEngine.get_classification(90) == FULLY_ACCESSIBLE
        assert AccessibilityEngine.get_classification(89) == MOSTLY_ACCESSIBLE
        assert AccessibilityEngine.get_classification(70) == MOSTLY_ACCESSIBLE
        assert AccessibilityEngine.get_classification(69) == PARTIALLY_ACCESSIBLE
        assert AccessibilityEngine.get_classification(40) == PARTIALLY_ACCESSIBLE
        assert AccessibilityEngine.get_classification(39) == LIMITED_ACCESSIBILITY
        assert AccessibilityEngine.get_classification(0) == LIMITED_ACCESSIBILITY

    def test_evidence_schema_structure(self):
        """D1: Evidence objects adhere strictly to typed values."""
        stair = make_detection("stairs", category="stair_hazard")
        res = AccessibilityEngine.analyze([stair])
        for ev in res["evidence"]:
            assert ev.status in ["detected", "inferred", "unknown", "not_detected"]

    def test_dual_confidence_reporting(self):
        """H1: Vision confidence and assessment confidence are reported separately."""
        d1 = make_detection("person", category="pedestrian", confidence=0.88)
        d2 = make_detection("person", category="pedestrian", confidence=0.92)
        res = AccessibilityEngine.analyze([d1, d2])
        assert res["vision_confidence"] == 0.90
        assert res["assessment_confidence"] in ["HIGH", "MEDIUM", "LOW"]

    def test_detailed_factors_breakdown_audit(self):
        """F1: Score breakdown contains detailed inspectable factors."""
        bench = make_detection("bench", category="obstacle", bbox=[260.0, 320.0, 380.0, 440.0])
        res = AccessibilityEngine.analyze([bench])
        detailed = res["breakdown"].detailed_factors
        assert len(detailed) > 0
        assert any(df.category == "obstacle" and df.points < 0 for df in detailed)

    def test_speech_summary_generation(self):
        """I1: Speech summary string is populated for screen readers / text-to-speech."""
        res = AccessibilityEngine.analyze([])
        assert "speech_summary" in res
        assert "Accessibility score" in res["speech_summary"]

    def test_deterministic_explanation_fallback(self):
        """F2: Deterministic explanation provider works reliably."""
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
        assert out["provider"] == "deterministic"

    def test_llm_provider_safe_fallback(self):
        """F3: LLM provider safely falls back to deterministic when no key is set."""
        provider = LLMExplanationProvider("gemini")
        out = provider.generate_explanation(
            score=75,
            classification=MOSTLY_ACCESSIBLE,
            evidence_summary=["clear path: inferred"],
            risks_summary=[],
            uncertainties=["Ramp unknown"],
            base_recommendations=["Verify in person"],
        )
        assert out["provider"] == "deterministic"
