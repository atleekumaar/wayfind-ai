import base64
import io
import logging
from typing import List
import cv2
import numpy as np
from PIL import Image

from app.schemas.analysis import Detection

logger = logging.getLogger(__name__)

# Color mapping in BGR for OpenCV
CATEGORY_COLORS = {
    "stair_hazard": (40, 40, 220),       # High-contrast Red
    "obstacle": (30, 144, 255),          # Amber / Orange
    "vehicle": (0, 165, 255),           # Orange
    "accessible_feature": (60, 220, 60), # Bright Green
    "mobility_aid": (220, 160, 50),      # Cyan/Blue
    "pedestrian": (200, 100, 50),        # Muted Blue
    "traffic_fixture": (128, 128, 128),  # Gray
    "general": (180, 180, 180)           # Gray
}


class ImageAnnotator:
    """Renders detected bounding boxes and metadata onto image using OpenCV."""

    @classmethod
    def annotate(cls, image: Image.Image, detections: List[Detection]) -> str:
        """
        Draws bounding boxes and labels on the image.
        Returns a base64-encoded JPEG data URL string.
        """
        try:
            # Convert PIL to BGR OpenCV image
            cv_img = cv2.cvtColor(np.array(image.convert("RGB")), cv2.COLOR_RGB2BGR)
            h, w = cv_img.shape[:2]

            for det in detections:
                x1, y1, x2, y2 = det.bbox
                x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)

                # Clamp coordinates to image boundaries
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w - 1, x2), min(h - 1, y2)

                color = CATEGORY_COLORS.get(det.category, (150, 150, 150))

                # Draw bounding box rectangle (thickness 2-3px based on image dimension)
                thickness = max(2, int(min(w, h) / 300))
                cv2.rectangle(cv_img, (x1, y1), (x2, y2), color, thickness)

                # Label text
                label = f"{det.class_name.upper()} {int(det.confidence * 100)}%"
                font = cv2.FONT_HERSHEY_SIMPLEX
                font_scale = max(0.45, min(w, h) / 1200.0)
                font_thickness = max(1, thickness - 1)

                (tw, th), baseline = cv2.getTextSize(label, font, font_scale, font_thickness)
                
                # Draw background badge for text readability
                badge_y1 = max(0, y1 - th - baseline - 4)
                badge_y2 = y1
                badge_x2 = min(w, x1 + tw + 6)
                
                cv2.rectangle(cv_img, (x1, badge_y1), (badge_x2, badge_y2), color, -1)
                
                # Draw white label text
                cv2.putText(
                    cv_img,
                    label,
                    (x1 + 3, y1 - 4),
                    font,
                    font_scale,
                    (255, 255, 255),
                    font_thickness,
                    cv2.LINE_AA,
                )

            # Encode as JPEG
            encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 85]
            _, buffer = cv2.imencode(".jpg", cv_img, encode_param)
            
            b64_str = base64.b64encode(buffer).decode("utf-8")
            return f"data:image/jpeg;base64,{b64_str}"

        except Exception as e:
            logger.error("Failed to annotate image: %s", e)
            return ""
