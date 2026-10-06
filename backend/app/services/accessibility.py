import logging
from typing import List, Dict, Tuple, Any, Optional

from app.schemas.analysis import (
    Detection,
    Evidence,
    Risk,
    Recommendation,
    ScoreBreakdown,
    FULLY_ACCESSIBLE,
    MOSTLY_ACCESSIBLE,
    PARTIALLY_ACCESSIBLE,
    LIMITED_ACCESSIBILITY,
    AccessibilityClassification,
    AssessmentConfidence,
)

logger = logging.getLogger(__name__)

# Classification Thresholds
THRESHOLD_FULLY_ACCESSIBLE = 90
THRESHOLD_MOSTLY_ACCESSIBLE = 70
THRESHOLD_PARTIALLY_ACCESSIBLE = 40

# Evidence-Aware Penalty and Reward Constants
PENALTY_STAIRS = 25
PENALTY_OBSTACLE = 10
PENALTY_VEHICLE = 15
PENALTY_CROWD = 5
REWARD_RAMP = 15
REWARD_CLEAR_PATH = 10

# Maximum cumulative caps
MAX_STAIRS_PENALTY = 50
MAX_OBSTACLE_PENALTY = 30
MAX_VEHICLE_PENALTY = 30


class AccessibilityEngine:
    """
    Evidence-aware deterministic accessibility rules and scoring engine.
    Computes an accessibility score (0-100), evaluates verification confidence,
    separates observed evidence from unknowns, and generates responsible recommendations.
    """

    @classmethod
    def get_classification(cls, score: int) -> AccessibilityClassification:
        """Determines the accessibility tier from the final score."""
        if score >= THRESHOLD_FULLY_ACCESSIBLE:
            return FULLY_ACCESSIBLE
        elif score >= THRESHOLD_MOSTLY_ACCESSIBLE:
            return MOSTLY_ACCESSIBLE
        elif score >= THRESHOLD_PARTIALLY_ACCESSIBLE:
            return PARTIALLY_ACCESSIBLE
        else:
            return LIMITED_ACCESSIBILITY

    @classmethod
    def analyze(
        cls,
        detections: List[Detection],
        image_dimensions: Optional[Tuple[int, int]] = None,
    ) -> Dict[str, Any]:
        """
        Evaluates detected visual entities with evidence-aware rules.
        Does NOT penalize for unobserved features (absence of evidence is not evidence of absence).
        """
        base_score = 100
        penalties = 0
        rewards = 0
        factors: List[str] = []
        risks: List[Risk] = []
        recommendations: List[Recommendation] = []
        evidence_list: List[Evidence] = []
        uncertainties: List[str] = []

        # Count detected items
        stairs_instances: List[Detection] = []
        obstacle_instances: List[Detection] = []
        vehicle_instances: List[Detection] = []
        pedestrian_instances: List[Detection] = []
        ramp_instances: List[Detection] = []

        for d in detections:
            cname = d.class_name.lower()
            cat = d.category

            if cat == "stair_hazard" or "stair" in cname or "step" in cname:
                stairs_instances.append(d)
            elif cat == "accessible_feature" or "ramp" in cname:
                ramp_instances.append(d)
            elif cat == "vehicle":
                vehicle_instances.append(d)
            elif cat == "pedestrian":
                pedestrian_instances.append(d)
            elif cat == "obstacle":
                obstacle_instances.append(d)

        # -------------------------------------------------------------
        # 1. POSITIVE BARRIER EVIDENCE: STAIRS
        # -------------------------------------------------------------
        if stairs_instances:
            stair_count = len(stairs_instances)
            avg_conf = sum(s.confidence for s in stairs_instances) / stair_count
            applied_penalty = min(stair_count * PENALTY_STAIRS, MAX_STAIRS_PENALTY)
            penalties += applied_penalty
            factors.append(f"-{applied_penalty} pts: {stair_count} stair barrier instance(s) detected")

            evidence_list.append(
                Evidence(
                    feature="Stairs / Steps",
                    status="detected",
                    source="object_detection",
                    confidence=round(avg_conf, 2),
                    description=f"{stair_count} instance(s) of stairs observed in visible path.",
                )
            )
            risks.append(
                Risk(
                    type="STAIRS_BARRIER",
                    severity="HIGH",
                    description=(
                        "Stairs were detected near the visible pathway and may present a significant "
                        "barrier for wheelchair users, strollers, and persons with mobility limitations."
                    ),
                )
            )
            recommendations.append(
                Recommendation(
                    priority="HIGH",
                    text="Look for a step-free entrance or verify ramp access before arrival.",
                )
            )
        else:
            evidence_list.append(
                Evidence(
                    feature="Stairs / Steps",
                    status="not_detected",
                    source="object_detection",
                    confidence=None,
                    description="No stair barriers detected in the visible camera perspective.",
                )
            )

        # -------------------------------------------------------------
        # 2. POSITIVE BARRIER EVIDENCE: OBSTACLES
        # -------------------------------------------------------------
        if obstacle_instances:
            obs_count = len(obstacle_instances)
            obs_names = sorted(list({o.class_name for o in obstacle_instances}))
            avg_conf = sum(o.confidence for o in obstacle_instances) / obs_count
            applied_penalty = min(obs_count * PENALTY_OBSTACLE, MAX_OBSTACLE_PENALTY)
            penalties += applied_penalty
            obs_str = ", ".join(obs_names)
            factors.append(f"-{applied_penalty} pts: Pathway obstacle(s) detected ({obs_str})")

            evidence_list.append(
                Evidence(
                    feature="Pathway Obstacles",
                    status="detected",
                    source="object_detection",
                    confidence=round(avg_conf, 2),
                    description=f"Objects detected in visible scene ({obs_str}).",
                )
            )
            risks.append(
                Risk(
                    type="PATHWAY_OBSTACLE",
                    severity="MEDIUM",
                    description=f"Potential pathway obstruction detected ({obs_str}). May restrict clear passage width.",
                )
            )
            recommendations.append(
                Recommendation(
                    priority="MEDIUM",
                    text=f"Inspect pathway around detected items ({obs_str}) for sufficient navigation clearance.",
                )
            )
        else:
            evidence_list.append(
                Evidence(
                    feature="Pathway Obstacles",
                    status="not_detected",
                    source="object_detection",
                    confidence=None,
                    description="No major physical obstacles detected in the visible pathway.",
                )
            )

        # -------------------------------------------------------------
        # 3. POSITIVE BARRIER EVIDENCE: VEHICLES
        # -------------------------------------------------------------
        if vehicle_instances:
            veh_count = len(vehicle_instances)
            veh_names = sorted(list({v.class_name for v in vehicle_instances}))
            avg_conf = sum(v.confidence for v in vehicle_instances) / veh_count
            applied_penalty = min(veh_count * PENALTY_VEHICLE, MAX_VEHICLE_PENALTY)
            penalties += applied_penalty
            veh_str = ", ".join(veh_names)
            factors.append(f"-{applied_penalty} pts: Vehicle(s) detected near path ({veh_str})")

            evidence_list.append(
                Evidence(
                    feature="Vehicles Near Pathway",
                    status="detected",
                    source="object_detection",
                    confidence=round(avg_conf, 2),
                    description=f"Vehicles ({veh_str}) observed in vicinity of pedestrian access.",
                )
            )
            risks.append(
                Risk(
                    type="VEHICLE_PROXIMITY",
                    severity="MEDIUM",
                    description=(
                        f"Vehicle ({veh_str}) detected in the scene. "
                        "Verify that drop-off zones or curb transitions are not obstructed."
                    ),
                )
            )
            recommendations.append(
                Recommendation(
                    priority="LOW",
                    text="Exercise caution around vehicular areas and confirm drop-off zone or curb cut is clear.",
                )
            )

        # -------------------------------------------------------------
        # 4. PEDESTRIAN CONGESTION
        # -------------------------------------------------------------
        person_count = len(pedestrian_instances)
        if person_count > 4:
            penalties += PENALTY_CROWD
            factors.append(f"-{PENALTY_CROWD} pts: High pedestrian density ({person_count} persons detected)")
            evidence_list.append(
                Evidence(
                    feature="Crowd Congestion",
                    status="detected",
                    source="object_detection",
                    confidence=0.85,
                    description=f"Pedestrian volume ({person_count} persons) may reduce navigation speed.",
                )
            )
            risks.append(
                Risk(
                    type="HIGH_PEDESTRIAN_DENSITY",
                    severity="LOW",
                    description="High pedestrian volume may restrict comfortable wheelchair or mobility device transit.",
                )
            )

        # -------------------------------------------------------------
        # 5. POSITIVE ACCESSIBLE FEATURE: RAMP
        # -------------------------------------------------------------
        if ramp_instances:
            rewards += REWARD_RAMP
            factors.append(f"+{REWARD_RAMP} pts: Accessible ramp positively identified")
            evidence_list.append(
                Evidence(
                    feature="Accessible Ramp",
                    status="detected",
                    source="object_detection",
                    confidence=0.90,
                    description="Step-free ramp transition positively identified in the visible frame.",
                )
            )
            recommendations.append(
                Recommendation(
                    priority="LOW",
                    text="Utilize the identified ramp for step-free grade transition.",
                )
            )
        else:
            # RESPONSIBLE AI RULE: No penalty for unobserved ramp!
            evidence_list.append(
                Evidence(
                    feature="Accessible Ramp",
                    status="unknown",
                    source="unsupported",
                    confidence=None,
                    description="No ramp detected in visible area. General vision model cannot rule out a ramp outside camera frame.",
                )
            )
            uncertainties.append("Ramp availability cannot be determined from this single camera perspective.")

        # -------------------------------------------------------------
        # 6. DOMAIN UNKNOWNS & SCOPE LIMITATIONS
        # -------------------------------------------------------------
        evidence_list.append(
            Evidence(
                feature="Tactile Paving",
                status="unknown",
                source="unsupported",
                confidence=None,
                description="Visual indicators for visually impaired guidance are not classified by current model.",
            )
        )
        uncertainties.append("Tactile paving and micro-surface defects (cracks, potholes) require dedicated on-site verification.")

        evidence_list.append(
            Evidence(
                feature="Ramp Slope / ADA Gradient",
                status="unknown",
                source="depth_estimation",
                confidence=None,
                description="Metric slope gradient (1:12 ADA standard) cannot be computed without stereo depth or LiDAR.",
            )
        )
        uncertainties.append("Ramp slope/incline gradient angles and door width measurements cannot be metrically certified from monocular 2D imagery.")

        # -------------------------------------------------------------
        # 7. INFERRED CLEAR PATHWAY
        # -------------------------------------------------------------
        if not stairs_instances and not obstacle_instances and not vehicle_instances:
            rewards += REWARD_CLEAR_PATH
            factors.append(f"+{REWARD_CLEAR_PATH} pts: No immediate physical barriers detected in visual field")
            evidence_list.append(
                Evidence(
                    feature="Clear Navigable Pathway",
                    status="inferred",
                    source="rule_engine",
                    confidence=0.80,
                    description="Pathway appears free of major step barriers or ground obstructions in visible area.",
                )
            )
            recommendations.append(
                Recommendation(
                    priority="LOW",
                    text="No major visual barriers were detected in this image. Verify conditions in person before relying on this assessment.",
                )
            )

        # Bounded score calculation
        raw_score = base_score - penalties + rewards
        final_score = max(0, min(100, raw_score))
        classification = cls.get_classification(final_score)

        # -------------------------------------------------------------
        # 8. ASSESSMENT CONFIDENCE CALCULATION
        # -------------------------------------------------------------
        # High confidence if significant visual features were detected or clear field confirmed
        total_detections = len(detections)
        if total_detections >= 3 or stairs_instances:
            assessment_confidence: AssessmentConfidence = "HIGH"
        elif total_detections >= 1 or not stairs_instances:
            assessment_confidence = "MEDIUM"
        else:
            assessment_confidence = "LOW"

        # Summary Generation
        summary = cls._generate_summary(
            final_score,
            classification,
            len(stairs_instances),
            len(ramp_instances),
            len(obstacle_instances),
            assessment_confidence,
        )

        breakdown = ScoreBreakdown(
            base_score=base_score,
            penalties=penalties,
            rewards=rewards,
            factors=factors,
        )

        return {
            "score": final_score,
            "classification": classification,
            "assessment_confidence": assessment_confidence,
            "assessment_scope": "visible_area_only",
            "evidence": evidence_list,
            "risks": risks,
            "recommendations": recommendations,
            "uncertainties": uncertainties,
            "summary": summary,
            "breakdown": breakdown,
        }

    @staticmethod
    def _generate_summary(
        score: int,
        classification: AccessibilityClassification,
        stairs_count: int,
        ramps_count: int,
        obstacles_count: int,
        confidence: AssessmentConfidence,
    ) -> str:
        """Constructs an evidence-qualified summary of physical accessibility."""
        labels = {
            FULLY_ACCESSIBLE: "Fully Accessible",
            MOSTLY_ACCESSIBLE: "Mostly Accessible",
            PARTIALLY_ACCESSIBLE: "Partially Accessible",
            LIMITED_ACCESSIBILITY: "Limited Accessibility",
        }
        human_class = labels.get(classification, classification)

        if stairs_count > 0:
            return (
                f"Evaluated as {human_class} ({score}/100, {confidence} confidence). "
                f"Stairs were detected near the visible pathway and may present a mobility barrier. "
                "Ramp availability cannot be determined from this single viewpoint."
            )
        elif obstacles_count > 0:
            return (
                f"Evaluated as {human_class} ({score}/100, {confidence} confidence). "
                "No step barriers detected, but potential pathway obstacles may reduce navigable clearance for mobility devices."
            )
        else:
            return (
                f"Evaluated as {human_class} ({score}/100, {confidence} confidence). "
                "No major visual barriers were detected in the analyzed area. "
                "Visual analysis is limited to the camera field of view."
            )
