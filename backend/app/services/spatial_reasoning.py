import logging
from typing import List, Tuple, Optional
from app.schemas.analysis import Detection, SpatialAssessment

logger = logging.getLogger(__name__)


class SpatialReasoner:
    """
    Image-space heuristic spatial reasoning service.
    Estimates the likely pedestrian navigation corridor in monocular street/sidewalk photography
    and evaluates whether detected objects physically interfere with the navigable corridor.
    """

    @classmethod
    def evaluate(
        cls,
        detections: List[Detection],
        image_dimensions: Optional[Tuple[int, int]] = None,
    ) -> List[SpatialAssessment]:
        """
        Evaluates each detection against the estimated pedestrian navigation corridor.
        
        Args:
            detections: List of Detection objects from the computer vision model.
            image_dimensions: Optional (width, height) tuple in pixels. Defaults to (640, 480).
            
        Returns:
            List of SpatialAssessment objects with navigation relevance and grounded explanations.
        """
        if not detections:
            return []

        w, h = image_dimensions if (image_dimensions and image_dimensions[0] > 0 and image_dimensions[1] > 0) else (640, 480)

        # Inferred Navigation Corridor in Image-Space (Normalized [x1, y1, x2, y2]):
        # Ground plane is typically in lower 55% of the frame (y >= 0.45 * h).
        # Pedestrian movement concentrates in the central 60% corridor (x from 0.20 * w to 0.80 * w).
        # Immediate foreground (y >= 0.75 * h) widens to (x from 0.10 * w to 0.90 * w).
        corridor_y_min = 0.45 * h
        corridor_x_min = 0.20 * w
        corridor_x_max = 0.80 * w

        assessments: List[SpatialAssessment] = []

        for d in detections:
            bbox = d.bbox
            if len(bbox) != 4:
                continue

            x1, y1, x2, y2 = bbox
            # Clean and clamp invalid or inverted bbox coordinates defensively
            x1, x2 = min(x1, x2), max(x1, x2)
            y1, y2 = min(y1, y2), max(y1, y2)
            x1 = max(0.0, min(float(w), float(x1)))
            x2 = max(0.0, min(float(w), float(x2)))
            y1 = max(0.0, min(float(h), float(y1)))
            y2 = max(0.0, min(float(h), float(y2)))

            box_w = max(0.0, x2 - x1)
            box_h = max(0.0, y2 - y1)
            box_area = box_w * box_h

            if box_area <= 0:
                # Degenerate zero-area bbox
                assessments.append(
                    SpatialAssessment(
                        class_name=d.class_name,
                        bbox=bbox,
                        relation_to_path="outside_navigation_corridor",
                        overlap_ratio=0.0,
                        proximity_level="background_context",
                        navigation_relevance="contextual_outside_corridor",
                        confidence=0.5,
                        explanation="Degenerate or zero-area bounding box ignored in corridor analysis.",
                    )
                )
                continue

            # Calculate intersection of bbox with primary ground corridor
            inter_x1 = max(x1, corridor_x_min)
            inter_y1 = max(y1, corridor_y_min)
            inter_x2 = min(x2, corridor_x_max)
            inter_y2 = min(y2, float(h))

            inter_w = max(0.0, inter_x2 - inter_x1)
            inter_h = max(0.0, inter_y2 - inter_y1)
            inter_area = inter_w * inter_h

            overlap_ratio = round(inter_area / box_area, 3)

            # Determine proximity level based on vertical base of the object
            base_y = y2
            if base_y >= 0.75 * h:
                proximity_level = "immediate_foreground"
            elif base_y >= 0.50 * h:
                proximity_level = "midground_corridor"
            else:
                proximity_level = "background_context"

            # Evaluate relationship to path and navigation relevance
            if overlap_ratio >= 0.30 and base_y >= 0.45 * h:
                relation_to_path = "inside_navigation_corridor"
                navigation_relevance = "corridor_obstruction"
                explanation = (
                    f"Potential obstruction based on image-space proximity ({int(overlap_ratio * 100)}% overlap) "
                    "to the inferred pedestrian navigation corridor."
                )
                conf = round(min(0.95, d.confidence * 0.9 + 0.1), 2)
            elif overlap_ratio >= 0.08 or (base_y >= 0.60 * h and (x1 < corridor_x_min or x2 > corridor_x_max)):
                relation_to_path = "boundary_corridor"
                navigation_relevance = "pathway_restriction"
                explanation = (
                    f"{d.class_name.capitalize()} positioned along the boundary of the inferred corridor; "
                    "may narrow navigable width without completely blocking passage."
                )
                conf = round(d.confidence * 0.85, 2)
            else:
                relation_to_path = "outside_navigation_corridor"
                navigation_relevance = "contextual_outside_corridor"
                explanation = (
                    f"{d.class_name.capitalize()} detected outside the inferred pedestrian pathway; "
                    "contextual background feature with minimal direct mobility restriction."
                )
                conf = round(d.confidence * 0.9, 2)

            assessments.append(
                SpatialAssessment(
                    class_name=d.class_name,
                    bbox=[round(x1, 2), round(y1, 2), round(x2, 2), round(y2, 2)],
                    relation_to_path=relation_to_path,
                    overlap_ratio=overlap_ratio,
                    proximity_level=proximity_level,
                    navigation_relevance=navigation_relevance,
                    confidence=conf,
                    explanation=explanation,
                )
            )

        return assessments
