import logging
from typing import List, Tuple, Dict, Any, Optional
import numpy as np

logger = logging.getLogger(__name__)


class WalkableAreaEstimator:
    """
    Modular walkable area segmentation and spatial region estimation service.
    
    Provides an interface for semantic ground-plane / pedestrian carpet estimation.
    When a lightweight neural segmentation model is unavailable on CPU or not configured,
    gracefully provides a mathematically parameterized perspective corridor mask with
    explicit fallback provenance ('geometric_perspective_corridor').
    """

    def __init__(self, method: str = "geometric_perspective"):
        self.method = method

    def estimate_walkable_area(
        self,
        image_width: int,
        image_height: int,
    ) -> Dict[str, Any]:
        """
        Estimates the walkable polygon region in normalized and pixel coordinates.
        Returns:
            - polygon: List of [x, y] coordinates forming the boundary polygon
            - method: Estimation method used ('segmentation_model' vs 'geometric_perspective_corridor')
            - confidence: Heuristic or model confidence
            - is_fallback: Boolean flag indicating if heuristic fallback is active
            - limitations: Documented boundary limitations
        """
        # Trapezoidal perspective corridor:
        # Top boundary at y=0.45 (midground horizon), width 50% [0.25 -> 0.75]
        # Bottom boundary at y=1.00 (immediate foreground), width 80% [0.10 -> 0.90]
        pts_norm = [
            [0.25, 0.45],
            [0.75, 0.45],
            [0.90, 1.00],
            [0.10, 1.00],
        ]

        pts_pixel = [
            [round(x * image_width, 1), round(y * image_height, 1)]
            for x, y in pts_norm
        ]

        return {
            "polygon_normalized": pts_norm,
            "polygon_pixel": pts_pixel,
            "method": self.method,
            "is_fallback": True,
            "confidence": 0.75,
            "limitations": "Geometric ground-plane approximation; metric slope/curb cuts require stereoscopic depth.",
        }

    def compute_box_walkable_overlap(
        self,
        bbox: List[float],
        image_width: int,
        image_height: int,
    ) -> float:
        """
        Computes the fractional overlap between a 2D bounding box and the walkable area.
        """
        x1, y1, x2, y2 = bbox
        # Normalize
        x1_n, x2_n = x1 / image_width, x2 / image_width
        y1_n, y2_n = y1 / image_height, y2 / image_height

        # Calculate bounding box footprint in lower region (y in [0.45, 1.0])
        box_center_x = (x1_n + x2_n) / 2.0
        box_base_y = y2_n

        # If base of object is in upper half of image (sky/buildings), overlap is negligible
        if box_base_y < 0.45:
            return 0.0

        # Corridor boundaries at this specific y:
        # linear interpolation from y=0.45 (left=0.25, right=0.75) to y=1.00 (left=0.10, right=0.90)
        t = (box_base_y - 0.45) / 0.55
        t = max(0.0, min(1.0, t))
        corridor_left = 0.25 + t * (0.10 - 0.25)
        corridor_right = 0.75 + t * (0.90 - 0.75)

        # Overlap fraction along horizontal axis
        overlap_w = max(0.0, min(x2_n, corridor_right) - max(x1_n, corridor_left))
        box_w = max(1e-5, x2_n - x1_n)

        return round(min(1.0, overlap_w / box_w), 2)
