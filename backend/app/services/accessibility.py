import logging
from typing import List, Dict, Tuple, Any, Optional

from app.schemas.analysis import (
    Detection,
    Risk,
    Recommendation,
    ScoreBreakdown,
    FULLY_ACCESSIBLE,
    MOSTLY_ACCESSIBLE,
    PARTIALLY_ACCESSIBLE,
    LIMITED_ACCESSIBILITY,
    AccessibilityClassification,
)

logger = logging.getLogger(__name__)

# Classification Thresholds
THRESHOLD_FULLY_ACCESSIBLE = 90
THRESHOLD_MOSTLY_ACCESSIBLE = 70
THRESHOLD_PARTIALLY_ACCESSIBLE = 40

# Penalty and Reward Constants
PENALTY_STAIRS = 25
PENALTY_OBSTACLE = 10
PENALTY_VEHICLE = 15
PENALTY_CROWD = 5  # Applied if dense crowd (> 4 persons)
REWARD_RAMP = 15
REWARD_CLEAR_PATH = 10

# Maximum cumulative penalties per category to avoid score obliteration from repeat detections
MAX_STAIRS_PENALTY = 50
MAX_OBSTACLE_PENALTY = 30
MAX_VEHICLE_PENALTY = 30


class AccessibilityEngine:
    """
    Deterministic accessibility rules and scoring engine.
    Computes an accessibility score (0-100), classifies accessibility state,
    and produces structured risks and actionable recommendations.
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
        Evaluates detected objects and produces accessibility assessment.
        
        Args:
            detections: List of Detection objects from the detector service.
            image_dimensions: Optional (width, height) tuple to evaluate spatial positioning.
            
        Returns:
            Dict containing score, classification, risks, recommendations, summary, and breakdown.
        """
        base_score = 100
        penalties = 0
        rewards = 0
        factors: List[str] = []
        risks: List[Risk] = []
        recommendations: List[Recommendation] = []

        # Count detected items by category and name
        stairs_count = 0
        obstacle_count = 0
        vehicle_count = 0
        person_count = 0
        ramp_count = 0
        obstacle_names: List[str] = []
        vehicle_names: List[str] = []

        for d in detections:
            cname = d.class_name.lower()
            cat = d.category

            if cat == "stair_hazard" or "stair" in cname or "step" in cname:
                stairs_count += 1
            elif cat == "accessible_feature" or "ramp" in cname:
                ramp_count += 1
            elif cat == "vehicle":
                vehicle_count += 1
                vehicle_names.append(cname)
            elif cat == "pedestrian":
                person_count += 1
            elif cat == "obstacle":
                obstacle_count += 1
                obstacle_names.append(cname)

        # 1. Rule: Stairs Hazard
        if stairs_count > 0:
            applied_penalty = min(stairs_count * PENALTY_STAIRS, MAX_STAIRS_PENALTY)
            penalties += applied_penalty
            factors.append(f"-{applied_penalty} pts: {stairs_count} stair barrier(s) detected")
            
            risks.append(
                Risk(
                    type="STAIRS_BARRIER",
                    severity="HIGH",
                    description=(
                        f"Stairs detected in the analyzed environment ({stairs_count} visual instance). "
                        "This presents a primary barrier for wheelchair users, strollers, and persons with mobility impairments."
                    ),
                )
            )
            recommendations.append(
                Recommendation(
                    priority="HIGH",
                    text="Look for an alternative entrance or pathway with a dedicated ramp or step-free access."
                )
            )

        # 2. Rule: Obstacles on Pathway
        if obstacle_count > 0:
            applied_penalty = min(obstacle_count * PENALTY_OBSTACLE, MAX_OBSTACLE_PENALTY)
            penalties += applied_penalty
            unique_obstacles = ", ".join(sorted(set(obstacle_names)))
            factors.append(f"-{applied_penalty} pts: Pathway obstacle(s) detected ({unique_obstacles})")
            
            risks.append(
                Risk(
                    type="PATHWAY_OBSTACLE",
                    severity="MEDIUM",
                    description=(
                        f"Potential pathway obstruction detected ({unique_obstacles}). "
                        "May narrow navigable width below the standard 36-inch clearance required for mobility devices."
                    ),
                )
            )
            recommendations.append(
                Recommendation(
                    priority="MEDIUM",
                    text=f"Inspect the pathway for a clear route around detected obstacles ({unique_obstacles})."
                )
            )

        # 3. Rule: Vehicles Near Pathway
        if vehicle_count > 0:
            applied_penalty = min(vehicle_count * PENALTY_VEHICLE, MAX_VEHICLE_PENALTY)
            penalties += applied_penalty
            unique_vehicles = ", ".join(sorted(set(vehicle_names)))
            factors.append(f"-{applied_penalty} pts: Vehicle(s) detected near pathway ({unique_vehicles})")
            
            risks.append(
                Risk(
                    type="VEHICLE_PROXIMITY",
                    severity="MEDIUM",
                    description=(
                        f"Vehicle ({unique_vehicles}) detected in the scene. "
                        "Additional spatial attention required to verify curb ramps or sidewalk access are not blocked."
                    ),
                )
            )
            recommendations.append(
                Recommendation(
                    priority="LOW",
                    text="Exercise caution around vehicular areas and confirm drop-off or curb cut transitions are clear."
                )
            )

        # 4. Rule: Crowd Density
        if person_count > 4:
            penalties += PENALTY_CROWD
            factors.append(f"-{PENALTY_CROWD} pts: High pedestrian density ({person_count} persons detected)")
            risks.append(
                Risk(
                    type="HIGH_PEDESTRIAN_DENSITY",
                    severity="LOW",
                    description=f"High pedestrian volume ({person_count} persons) may reduce navigation speed and ease of movement.",
                )
            )

        # 5. Rule: Accessible Ramp Detected
        if ramp_count > 0:
            rewards += REWARD_RAMP
            factors.append(f"+{REWARD_RAMP} pts: Accessible ramp identified")
            recommendations.append(
                Recommendation(
                    priority="LOW",
                    text="Utilize the identified ramp for step-free grade transition."
                )
            )

        # 6. Rule: Clear Pathway (no major barriers detected)
        if stairs_count == 0 and obstacle_count == 0 and vehicle_count == 0:
            rewards += REWARD_CLEAR_PATH
            factors.append(f"+{REWARD_CLEAR_PATH} pts: No immediate physical barriers detected in visual field")
            recommendations.append(
                Recommendation(
                    priority="LOW",
                    text="No major accessibility barriers were detected in this image. Verify conditions in person before relying on this assessment."
                )
            )

        # Compute bounded score [0, 100]
        raw_score = base_score - penalties + rewards
        final_score = max(0, min(100, raw_score))

        classification = cls.get_classification(final_score)

        # Human-readable summary
        summary = cls._generate_summary(final_score, classification, stairs_count, ramp_count, obstacle_count)

        breakdown = ScoreBreakdown(
            base_score=base_score,
            penalties=penalties,
            rewards=rewards,
            factors=factors,
        )

        return {
            "score": final_score,
            "classification": classification,
            "risks": risks,
            "recommendations": recommendations,
            "summary": summary,
            "breakdown": breakdown,
        }

    @staticmethod
    def _generate_summary(
        score: int,
        classification: AccessibilityClassification,
        stairs: int,
        ramps: int,
        obstacles: int,
    ) -> str:
        """Constructs an objective, factual summary of visual accessibility."""
        labels = {
            FULLY_ACCESSIBLE: "Fully Accessible",
            MOSTLY_ACCESSIBLE: "Mostly Accessible",
            PARTIALLY_ACCESSIBLE: "Partially Accessible",
            LIMITED_ACCESSIBILITY: "Limited Accessibility",
        }
        human_class = labels.get(classification, classification)

        if stairs > 0 and ramps == 0:
            return (
                f"Evaluated as {human_class} ({score}/100). "
                "Main access route contains stair barriers with no visible ramp. Step-free entry requires an alternate route."
            )
        elif stairs > 0 and ramps > 0:
            return (
                f"Evaluated as {human_class} ({score}/100). "
                "Stairs are present, but an accessible ramp was also detected to support grade changes."
            )
        elif obstacles > 0:
            return (
                f"Evaluated as {human_class} ({score}/100). "
                "Step-free path observed, but potential pathway obstacles may impede wheelchair clearance."
            )
        else:
            return (
                f"Evaluated as {human_class} ({score}/100). "
                "Path appears clear of major obstructions and step barriers based on the visible field."
            )
