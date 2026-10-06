import logging
from typing import List, Optional, Tuple, Dict, Any
import numpy as np
from PIL import Image

from app.schemas.analysis import Detection
from app.config import settings

logger = logging.getLogger(__name__)

# Categorization mapping for COCO and accessibility-related classes
CLASS_CATEGORIES: Dict[str, str] = {
    # Mobility barriers & obstacles
    "chair": "obstacle",
    "bench": "obstacle",
    "potted plant": "obstacle",
    "suitcase": "obstacle",
    "backpack": "obstacle",
    "fire hydrant": "obstacle",
    "trash can": "obstacle",
    "stop sign": "traffic_fixture",
    "traffic light": "traffic_fixture",
    
    # Vehicles that can block ramps / curb cuts / sidewalks
    "car": "vehicle",
    "truck": "vehicle",
    "bus": "vehicle",
    "motorcycle": "vehicle",
    "bicycle": "vehicle",
    
    # Pedestrians / crowd density
    "person": "pedestrian",
    
    # Potential stairs or structural features (if detected by specialized models)
    "stairs": "stair_hazard",
    "stairway": "stair_hazard",
    "steps": "stair_hazard",
    "ramp": "accessible_feature",
    "wheelchair": "mobility_aid",
}

class Detector:
    """Computer vision object detection service wrapping YOLOv8."""

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or settings.MODEL_PATH
        self.model = None
        self._load_model()

    def _load_model(self) -> None:
        """Loads the Ultralytics YOLO model."""
        try:
            from ultralytics import YOLO
            logger.info("Loading YOLO detection model from %s...", self.model_path)
            self.model = YOLO(self.model_path)
            logger.info("YOLO model loaded successfully.")
        except Exception as e:
            logger.error("Failed to load YOLO model: %s. Running in fallback mode.", e)
            self.model = None

    @property
    def is_loaded(self) -> bool:
        return self.model is not None

    def get_supported_classes(self) -> List[str]:
        """Returns the list of classes known to the active model."""
        if self.model is not None and hasattr(self.model, "names"):
            return list(self.model.names.values())
        return []

    def detect(self, image: Image.Image, conf_threshold: Optional[float] = None) -> List[Detection]:
        """
        Runs object detection on the provided PIL image.
        Returns a list of structured Detection items with normalized/absolute coordinates.
        """
        if self.model is None:
            logger.warning("Detector model is not initialized; returning empty detections.")
            return []

        conf = conf_threshold if conf_threshold is not None else settings.DEFAULT_CONFIDENCE
        
        try:
            # Ensure image is in RGB format
            if image.mode != "RGB":
                image = image.convert("RGB")

            # Run inference (YOLO accepts PIL images directly)
            results = self.model(image, conf=conf, verbose=False)
            
            detections: List[Detection] = []
            
            if not results or len(results) == 0:
                return detections

            result = results[0]
            boxes = result.boxes

            if boxes is None or len(boxes) == 0:
                return detections

            for box in boxes:
                # Extract coordinates [x1, y1, x2, y2]
                xyxy = box.xyxy[0].tolist()
                confidence = float(box.conf[0])
                cls_id = int(box.cls[0])
                class_name = self.model.names.get(cls_id, f"class_{cls_id}").lower()
                
                category = CLASS_CATEGORIES.get(class_name, "general")

                detections.append(
                    Detection(
                        class_name=class_name,
                        confidence=round(confidence, 3),
                        bbox=[round(coord, 2) for coord in xyxy],
                        category=category
                    )
                )

            return detections

        except Exception as e:
            logger.exception("Error during detection inference: %s", e)
            return []
