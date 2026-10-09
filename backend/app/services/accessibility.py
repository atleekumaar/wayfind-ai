import logging
from typing import List, Dict, Tuple, Any, Optional

from app.schemas.analysis import (
    Detection,
    SpatialAssessment,
    Evidence,
    Risk,
    Recommendation,
    ScoreBreakdown,
    ScoreBreakdownFactor,
    FULLY_ACCESSIBLE,
    MOSTLY_ACCESSIBLE,
    PARTIALLY_ACCESSIBLE,
    LIMITED_ACCESSIBILITY,
    AccessibilityClassification,
    AssessmentConfidence,
    AssessmentStatus,
    AccessibilityProfile,
)
from app.services.spatial_reasoning import SpatialReasoner

logger = logging.getLogger(__name__)

# Classification Thresholds
THRESHOLD_FULLY_ACCESSIBLE = 90
THRESHOLD_MOSTLY_ACCESSIBLE = 70
THRESHOLD_PARTIALLY_ACCESSIBLE = 40

# Profile-based weightings matrix (Deterministic penalties and rewards)
PROFILE_WEIGHTS: Dict[AccessibilityProfile, Dict[str, int]] = {
    "general_mobility": {
        "stairs": 25,
        "obstacle_corridor": 10,
        "obstacle_boundary": 5,
        "vehicle_corridor": 15,
        "vehicle_boundary": 8,
        "crowd": 5,
        "ramp_reward": 15,
        "clear_reward": 10,
    },
    "wheelchair": {
        "stairs": 35,
        "obstacle_corridor": 15,
        "obstacle_boundary": 8,
        "vehicle_corridor": 20,
        "vehicle_boundary": 10,
        "crowd": 5,
        "ramp_reward": 20,
        "clear_reward": 10,
    },
    "walker": {
        "stairs": 30,
        "obstacle_corridor": 12,
        "obstacle_boundary": 6,
        "vehicle_corridor": 15,
        "vehicle_boundary": 8,
        "crowd": 5,
        "ramp_reward": 15,
        "clear_reward": 10,
    },
    "stroller": {
        "stairs": 30,
        "obstacle_corridor": 10,
        "obstacle_boundary": 5,
        "vehicle_corridor": 15,
        "vehicle_boundary": 8,
        "crowd": 5,
        "ramp_reward": 15,
        "clear_reward": 10,
    },
    "low_vision": {
        "stairs": 25,
        "obstacle_corridor": 20,
        "obstacle_boundary": 10,
        "vehicle_corridor": 15,
        "vehicle_boundary": 8,
        "crowd": 5,
        "ramp_reward": 10,
        "clear_reward": 10,
    },
}

# Maximum cumulative penalty caps per category
MAX_STAIRS_PENALTY = 50
MAX_OBSTACLE_PENALTY = 35
MAX_VEHICLE_PENALTY = 30


class AccessibilityEngine:
    """
    Spatial-aware and Profile-aware deterministic accessibility rules engine.
    Calculates 0-100 score, evaluates spatial navigation relevance, separates evidence,
    and produces grounded explanations without relying on LLMs for calculations.
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
        profile: AccessibilityProfile = "general_mobility",
    ) -> Dict[str, Any]:
        """
        Evaluates detected visual entities using spatial barrier localization
        and profile-aware weighting.
        """
        weights = PROFILE_WEIGHTS.get(profile, PROFILE_WEIGHTS["general_mobility"])
        base_score = 100
        penalties = 0
        rewards = 0
        factors: List[str] = []
        detailed_factors: List[ScoreBreakdownFactor] = []
        risks: List[Risk] = []
        recommendations: List[Recommendation] = []
        evidence_list: List[Evidence] = []
        uncertainties: List[str] = []

        # 1. Run Spatial Barrier Localization
        spatial_assessments = SpatialReasoner.evaluate(detections, image_dimensions)

        # Map spatial assessments to detections for fast lookup
        spatial_by_index: Dict[int, SpatialAssessment] = {
            i: spatial_assessments[i] for i in range(len(spatial_assessments))
        }

        # Segregate detected objects
        stairs_instances: List[Tuple[Detection, SpatialAssessment]] = []
        obstacle_corridor: List[Tuple[Detection, SpatialAssessment]] = []
        obstacle_boundary: List[Tuple[Detection, SpatialAssessment]] = []
        obstacle_contextual: List[Tuple[Detection, SpatialAssessment]] = []
        vehicle_corridor: List[Tuple[Detection, SpatialAssessment]] = []
        vehicle_boundary: List[Tuple[Detection, SpatialAssessment]] = []
        vehicle_contextual: List[Tuple[Detection, SpatialAssessment]] = []
        pedestrian_instances: List[Detection] = []
        ramp_instances: List[Detection] = []

        for idx, d in enumerate(detections):
            # GLOBAL ENGINEERING RULE: Filter out detections that are not supported by the active model
            if not getattr(d, "is_model_supported", True) or getattr(d, "detection_status", "detected") == "unsupported":
                logger.warning("Ignoring unsupported detection from scoring: %s", d.class_name)
                continue

            cname = d.class_name.lower()
            cat = d.category
            sp = spatial_by_index.get(idx)

            if cat == "stair_hazard" or "stair" in cname or "step" in cname:
                stairs_instances.append((d, sp))
            elif cat == "accessible_feature" or "ramp" in cname:
                ramp_instances.append(d)
            elif cat == "pedestrian":
                pedestrian_instances.append(d)
            elif cat == "vehicle":
                if sp and sp.navigation_relevance == "corridor_obstruction":
                    vehicle_corridor.append((d, sp))
                elif sp and sp.navigation_relevance == "pathway_restriction":
                    vehicle_boundary.append((d, sp))
                else:
                    vehicle_contextual.append((d, sp))
            elif cat == "obstacle":
                if sp and sp.navigation_relevance == "corridor_obstruction":
                    obstacle_corridor.append((d, sp))
                elif sp and sp.navigation_relevance == "pathway_restriction":
                    obstacle_boundary.append((d, sp))
                else:
                    obstacle_contextual.append((d, sp))

        # -------------------------------------------------------------
        # 1. STAIRS EVALUATION
        # -------------------------------------------------------------
        if stairs_instances:
            count = len(stairs_instances)
            avg_conf = sum(s[0].confidence for s in stairs_instances) / count
            pts = min(count * weights["stairs"], MAX_STAIRS_PENALTY)
            penalties += pts
            factor_desc = f"-{pts} pts: {count} stair barrier instance(s) detected [{profile.replace('_', ' ').title()}]"
            factors.append(factor_desc)
            first_stair_id = stairs_instances[0][0].id if stairs_instances and hasattr(stairs_instances[0][0], "id") else None
            detailed_factors.append(
                ScoreBreakdownFactor(
                    factor=factor_desc,
                    points=-pts,
                    category="stairs",
                    status="detected",
                    source="object_detection",
                    confidence=round(avg_conf, 2),
                    detection_id=first_stair_id,
                    rule_name="stairs_penalty",
                    spatial_relevance="corridor_obstruction",
                )
            )
            evidence_list.append(
                Evidence(
                    feature="Stairs / Steps",
                    status="detected",
                    source="object_detection",
                    confidence=round(avg_conf, 2),
                    description=f"{count} stair instance(s) observed in the physical environment.",
                )
            )
            risks.append(
                Risk(
                    type="STAIRS_BARRIER",
                    severity="CRITICAL" if profile in ["wheelchair", "stroller"] else "HIGH",
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
        # 2. SPATIAL OBSTACLE EVALUATION
        # -------------------------------------------------------------
        # 2A. Direct Corridor Obstructions
        if obstacle_corridor:
            count = len(obstacle_corridor)
            names = sorted(list({o[0].class_name for o in obstacle_corridor}))
            avg_conf = sum(o[0].confidence for o in obstacle_corridor) / count
            pts = min(count * weights["obstacle_corridor"], MAX_OBSTACLE_PENALTY)
            penalties += pts
            name_str = ", ".join(names)
            factor_desc = f"-{pts} pts: {count} obstacle(s) inside pedestrian corridor ({name_str})"
            factors.append(factor_desc)
            first_obs_id = obstacle_corridor[0][0].id if obstacle_corridor and hasattr(obstacle_corridor[0][0], "id") else None
            detailed_factors.append(
                ScoreBreakdownFactor(
                    factor=factor_desc,
                    points=-pts,
                    category="obstacle",
                    status="detected",
                    source="spatial_corridor_analysis",
                    confidence=round(avg_conf, 2),
                    detection_id=first_obs_id,
                    rule_name="obstacle_corridor_penalty",
                    spatial_relevance="corridor_obstruction",
                )
            )
            evidence_list.append(
                Evidence(
                    feature="Pathway Obstacles",
                    status="detected",
                    source="spatial_corridor_analysis",
                    confidence=round(avg_conf, 2),
                    description=f"Obstacles ({name_str}) directly intersecting inferred pedestrian corridor.",
                )
            )
            risks.append(
                Risk(
                    type="PATHWAY_OBSTACLE",
                    severity="HIGH" if profile in ["wheelchair", "low_vision"] else "MEDIUM",
                    description=f"Pathway obstruction detected ({name_str}) within likely pedestrian travel line.",
                )
            )
            recommendations.append(
                Recommendation(
                    priority="MEDIUM",
                    text=f"Inspect pathway around detected items ({name_str}) for sufficient navigation clearance.",
                )
            )

        # 2B. Boundary Corridor Restrictions
        if obstacle_boundary:
            count = len(obstacle_boundary)
            names = sorted(list({o[0].class_name for o in obstacle_boundary}))
            pts = min(count * weights["obstacle_boundary"], 15)
            penalties += pts
            name_str = ", ".join(names)
            factor_desc = f"-{pts} pts: Boundary obstruction near pathway edge ({name_str})"
            factors.append(factor_desc)
            detailed_factors.append(
                ScoreBreakdownFactor(
                    factor=factor_desc,
                    points=-pts,
                    category="obstacle",
                    status="detected",
                    source="spatial_corridor_analysis",
                    confidence=0.8,
                )
            )
            risks.append(
                Risk(
                    type="BOUNDARY_OBSTACLE",
                    severity="LOW",
                    description=f"Object ({name_str}) near corridor edge; may narrow navigable passage width.",
                )
            )

        # 2C. Contextual Objects Outside Corridor (NO PENALTY!)
        if obstacle_contextual:
            count = len(obstacle_contextual)
            names = sorted(list({o[0].class_name for o in obstacle_contextual}))
            name_str = ", ".join(names)
            factor_desc = f"0 pts: {count} contextual object(s) detected outside corridor ({name_str})"
            factors.append(factor_desc)
            detailed_factors.append(
                ScoreBreakdownFactor(
                    factor=factor_desc,
                    points=0,
                    category="obstacle",
                    status="detected",
                    source="spatial_corridor_analysis",
                    confidence=0.9,
                )
            )
            evidence_list.append(
                Evidence(
                    feature="Contextual Surrounding Objects",
                    status="detected",
                    source="spatial_corridor_analysis",
                    confidence=0.9,
                    description=f"Objects ({name_str}) detected outside the inferred pedestrian path (no penalty).",
                )
            )

        if not obstacle_corridor and not obstacle_boundary and not obstacle_contextual:
            evidence_list.append(
                Evidence(
                    feature="Pathway Obstacles",
                    status="not_detected",
                    source="object_detection",
                    confidence=None,
                    description="No physical obstacles detected in the visible pathway.",
                )
            )

        # -------------------------------------------------------------
        # 3. SPATIAL VEHICLE EVALUATION
        # -------------------------------------------------------------
        if vehicle_corridor:
            count = len(vehicle_corridor)
            names = sorted(list({v[0].class_name for v in vehicle_corridor}))
            pts = min(count * weights["vehicle_corridor"], MAX_VEHICLE_PENALTY)
            penalties += pts
            name_str = ", ".join(names)
            factor_desc = f"-{pts} pts: Vehicle in pedestrian corridor ({name_str})"
            factors.append(factor_desc)
            first_veh_id = vehicle_corridor[0][0].id if vehicle_corridor and hasattr(vehicle_corridor[0][0], "id") else None
            detailed_factors.append(
                ScoreBreakdownFactor(
                    factor=factor_desc,
                    points=-pts,
                    category="vehicle",
                    status="detected",
                    source="spatial_corridor_analysis",
                    confidence=0.88,
                    detection_id=first_veh_id,
                    rule_name="vehicle_corridor_penalty",
                    spatial_relevance="corridor_obstruction",
                )
            )
            evidence_list.append(
                Evidence(
                    feature="Vehicles in Pathway",
                    status="detected",
                    source="spatial_corridor_analysis",
                    confidence=0.88,
                    description=f"Vehicle ({name_str}) directly positioned in pedestrian access zone.",
                )
            )
            risks.append(
                Risk(
                    type="VEHICLE_IN_PATH",
                    severity="HIGH",
                    description=f"Vehicle ({name_str}) intersecting likely pedestrian route. Drop-off or curb cut blocked.",
                )
            )
            recommendations.append(
                Recommendation(
                    priority="HIGH" if profile == "wheelchair" else "MEDIUM",
                    text="Exercise extreme caution around vehicles blocking access corridors.",
                )
            )
        elif vehicle_boundary:
            count = len(vehicle_boundary)
            pts = min(count * weights["vehicle_boundary"], 15)
            penalties += pts
            factor_desc = f"-{pts} pts: Vehicle parked along pathway perimeter"
            factors.append(factor_desc)
            detailed_factors.append(
                ScoreBreakdownFactor(
                    factor=factor_desc,
                    points=-pts,
                    category="vehicle",
                    status="detected",
                    source="spatial_corridor_analysis",
                    confidence=0.85,
                )
            )
        elif vehicle_contextual:
            # Vehicles on street/roadway far from pedestrian path = NO PENALTY!
            count = len(vehicle_contextual)
            factor_desc = f"0 pts: {count} vehicle(s) on distant roadway / outside pedestrian path"
            factors.append(factor_desc)
            detailed_factors.append(
                ScoreBreakdownFactor(
                    factor=factor_desc,
                    points=0,
                    category="vehicle",
                    status="detected",
                    source="spatial_corridor_analysis",
                    confidence=0.9,
                )
            )

        # -------------------------------------------------------------
        # 4. PEDESTRIAN CONGESTION
        # -------------------------------------------------------------
        person_count = len(pedestrian_instances)
        if person_count > 4:
            pts = weights["crowd"]
            penalties += pts
            factor_desc = f"-{pts} pts: Pedestrian congestion ({person_count} persons observed)"
            factors.append(factor_desc)
            detailed_factors.append(
                ScoreBreakdownFactor(
                    factor=factor_desc,
                    points=-pts,
                    category="pedestrian",
                    status="detected",
                    source="object_detection",
                    confidence=0.85,
                )
            )
            risks.append(
                Risk(
                    type="HIGH_PEDESTRIAN_DENSITY",
                    severity="LOW",
                    description=f"Crowd volume ({person_count} persons) may reduce travel velocity and mobility maneuvering.",
                )
            )

        # -------------------------------------------------------------
        # 5. POSITIVE ACCESSIBLE FEATURE: RAMP
        # -------------------------------------------------------------
        if ramp_instances:
            pts = weights["ramp_reward"]
            rewards += pts
            factor_desc = f"+{pts} pts: Accessible ramp identified in visible frame"
            factors.append(factor_desc)
            detailed_factors.append(
                ScoreBreakdownFactor(
                    factor=factor_desc,
                    points=pts,
                    category="ramp",
                    status="detected",
                    source="object_detection",
                    confidence=0.90,
                )
            )
            evidence_list.append(
                Evidence(
                    feature="Accessible Ramp",
                    status="detected",
                    source="object_detection",
                    confidence=0.90,
                    description="Step-free ramp transition positively identified in the visual field.",
                )
            )
            recommendations.append(
                Recommendation(
                    priority="LOW",
                    text="Utilize the identified ramp for step-free grade transition.",
                )
            )
        else:
            # RESPONSIBLE AI RULE: Unseen ramp = 0 penalty!
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
        # 7. INFERRED CLEAR PATHWAY (EVIDENCE-QUALIFIED ASSESSMENT)
        # -------------------------------------------------------------
        # GLOBAL ENGINEERING RULE: Never award points purely because the detector failed to find obstacles.
        # "Absence of detected barrier is NOT proof of unconstrained accessibility."
        if not stairs_instances and not obstacle_corridor and not vehicle_corridor:
            factor_desc = "0 pts: No supported barrier objects detected in visible corridor (Absence of evidence != confirmed clear)"
            factors.append(factor_desc)
            detailed_factors.append(
                ScoreBreakdownFactor(
                    factor=factor_desc,
                    points=0,
                    category="path",
                    status="inferred",
                    source="spatial_corridor_analysis",
                    confidence=0.70,
                    rule_name="no_visible_corridor_barriers",
                    spatial_relevance="inside_navigation_corridor",
                )
            )
            evidence_list.append(
                Evidence(
                    feature="Navigable Pathway Region",
                    status="inferred",
                    source="spatial_corridor_analysis",
                    confidence=0.70,
                    description="No supported barrier objects were detected in the visible analysis region. Verify path surface and clearance on-site.",
                )
            )
            recommendations.append(
                Recommendation(
                    priority="LOW",
                    text="No supported barrier objects detected in visible frame. Note that micro-surface grade, slope, and door clearance cannot be confirmed from 2D photos alone.",
                )
            )

        # -------------------------------------------------------------
        # 8. BOUNDED SCORE CALCULATION
        # -------------------------------------------------------------
        raw_score = base_score - penalties + rewards
        final_score = max(0, min(100, raw_score))
        classification = cls.get_classification(final_score)

        # -------------------------------------------------------------
        # 9. EVIDENCE SUFFICIENCY & ASSESSMENT STATUS CALCULATION
        # -------------------------------------------------------------
        # A. Vision Confidence: average detection confidence (strictly for positive detections)
        pos_confs = [d.confidence for d in detections if d.confidence > 0]
        vision_confidence = round(sum(pos_confs) / len(pos_confs), 2) if pos_confs else None

        # B. Evidence Sufficiency & Assessment Status:
        # GLOBAL ENGINEERING RULE:
        # Absence of detected barrier is NOT proof of accessibility.
        # If there are 0 detections, or only unsupported detections, assessment is INCONCLUSIVE.
        supported_detections = [
            d for d in detections
            if getattr(d, "is_model_supported", True) and getattr(d, "detection_status", "detected") != "unsupported"
        ]
        total_supported_barriers = len(stairs_instances) + len(obstacle_corridor) + len(vehicle_corridor)
        total_valid_detections = len(supported_detections)

        if total_valid_detections == 0:
            assessment_status: AssessmentStatus = "INCONCLUSIVE"
            assessment_status_reason = (
                "Insufficient visual evidence: zero supported objects detected in monocular camera perspective. "
                "Absence of detected obstacles does not verify an unconstrained accessible path. "
                "Additional viewpoints or on-site physical verification required."
            )
            evidence_sufficiency = "insufficient_evidence"
            assessment_confidence: AssessmentConfidence = "LOW"
        elif total_supported_barriers > 0:
            assessment_status: AssessmentStatus = "PRELIMINARY"
            assessment_status_reason = (
                f"Preliminary barrier assessment: {total_supported_barriers} barrier hazard(s) observed in navigation corridor. "
                "Provides actionable warning but does not certify entire location accessibility."
            )
            evidence_sufficiency = "sufficient_evidence"
            assessment_confidence = "HIGH" if total_supported_barriers >= 2 else "MEDIUM"
        else:
            # Detections exist (e.g. background objects or clear path features) but no barriers
            assessment_status: AssessmentStatus = "PRELIMINARY"
            assessment_status_reason = (
                "Preliminary visual survey: No supported corridor barriers localized in the visible frame. "
                "Ground-level slope, tactile paving, and doorway clearances remain unmeasured from 2D imagery."
            )
            evidence_sufficiency = "limited_evidence"
            assessment_confidence = "MEDIUM" if total_valid_detections >= 2 else "LOW"

        # Summary Generation
        summary = cls._generate_summary(
            final_score,
            classification,
            len(stairs_instances),
            len(ramp_instances),
            len(obstacle_corridor),
            assessment_confidence,
            profile,
            assessment_status,
            assessment_status_reason,
        )

        speech_summary = cls._generate_speech_summary(
            final_score,
            classification,
            len(stairs_instances),
            len(obstacle_corridor),
            profile,
            assessment_status,
        )

        breakdown = ScoreBreakdown(
            base_score=base_score,
            penalties=penalties,
            rewards=rewards,
            factors=factors,
            detailed_factors=detailed_factors,
        )

        return {
            "score": final_score,
            "classification": classification,
            "assessment_status": assessment_status,
            "assessment_status_reason": assessment_status_reason,
            "assessment_confidence": assessment_confidence,
            "vision_confidence": vision_confidence,
            "evidence_sufficiency": evidence_sufficiency,
            "assessment_scope": "visible_area_only",
            "profile": profile,
            "spatial_assessments": spatial_assessments,
            "evidence": evidence_list,
            "risks": risks,
            "recommendations": recommendations,
            "uncertainties": uncertainties,
            "summary": summary,
            "speech_summary": speech_summary,
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
        profile: AccessibilityProfile,
        assessment_status: AssessmentStatus = "PRELIMINARY",
        assessment_status_reason: Optional[str] = None,
    ) -> str:
        """Constructs an evidence-qualified summary of physical accessibility."""
        labels = {
            FULLY_ACCESSIBLE: "Fully Accessible",
            MOSTLY_ACCESSIBLE: "Mostly Accessible",
            PARTIALLY_ACCESSIBLE: "Partially Accessible",
            LIMITED_ACCESSIBILITY: "Limited Accessibility",
        }
        human_class = labels.get(classification, classification)
        prof_name = profile.replace("_", " ").title()

        if assessment_status == "INCONCLUSIVE":
            return (
                f"Assessment INCONCLUSIVE for {prof_name} (Nominal score: {score}/100, {confidence} confidence). "
                "Insufficient visual evidence detected in camera view to evaluate accessibility. "
                "Absence of detected barriers does not verify accessibility. Additional perspectives or on-site verification required."
            )

        if stairs_count > 0:
            return (
                f"Preliminary Assessment: {human_class} ({score}/100, {confidence} confidence) for {prof_name}. "
                f"Stairs were detected near the visible pathway and may present a significant mobility barrier. "
                "Ramp availability cannot be determined from this single viewpoint."
            )
        elif obstacles_count > 0:
            return (
                f"Preliminary Assessment: {human_class} ({score}/100, {confidence} confidence) for {prof_name}. "
                "Step-free path observed, but obstacles intersecting the inferred pedestrian corridor reduce navigable width."
            )
        else:
            return (
                f"Preliminary Assessment: {human_class} ({score}/100, {confidence} confidence) for {prof_name}. "
                "No major visual barriers were detected in the analyzed corridor. "
                "Visual analysis is limited to the camera field of view."
            )

    @staticmethod
    def _generate_speech_summary(
        score: int,
        classification: AccessibilityClassification,
        stairs_count: int,
        obstacles_count: int,
        profile: AccessibilityProfile,
        assessment_status: AssessmentStatus = "PRELIMINARY",
    ) -> str:
        """Constructs a concise, spoken text summary for browser speech synthesis."""
        tier = classification.replace("_", " ").title()
        prof = profile.replace("_", " ").title()

        if assessment_status == "INCONCLUSIVE":
            return (
                f"Assessment inconclusive for {prof}. Insufficient visual evidence to confirm accessibility. "
                "Please capture additional camera angles or verify on-site."
            )

        if stairs_count > 0:
            return (
                f"Preliminary assessment: score {score} out of 100, {tier} for {prof}. "
                "Stairs were detected near the visible route. A step-free ramp could not be verified."
            )
        elif obstacles_count > 0:
            return (
                f"Preliminary assessment: score {score} out of 100, {tier} for {prof}. "
                "Potential pathway obstruction detected along the pedestrian corridor."
            )
        else:
            return (
                f"Preliminary assessment: score {score} out of 100, {tier} for {prof}. "
                "No major physical step barriers detected in the visible camera perspective."
            )
