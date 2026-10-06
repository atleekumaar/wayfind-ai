import time
import uuid
import logging
from typing import Optional
from PIL import Image

from app.schemas.analysis import AnalysisResponse
from app.services.detector import Detector
from app.services.accessibility import AccessibilityEngine
from app.services.annotator import ImageAnnotator

logger = logging.getLogger(__name__)


class AccessibilityAnalyzer:
    """
    Orchestrates end-to-end accessibility analysis pipeline:
    Image -> Object Detection -> Rule-based Scoring -> Image Annotation -> Structured Response.
    """

    def __init__(self, detector: Optional[Detector] = None):
        self.detector = detector or Detector()

    def analyze(
        self,
        image: Image.Image,
        confidence_threshold: Optional[float] = None,
        generate_annotation: bool = True,
    ) -> AnalysisResponse:
        """
        Executes end-to-end visual accessibility analysis.
        
        Args:
            image: PIL Image object.
            confidence_threshold: Optional override for model confidence.
            generate_annotation: Whether to generate an annotated image with bounding boxes.
            
        Returns:
            AnalysisResponse containing score, classification, detections, risks, recommendations, and timing.
        """
        start_time = time.perf_counter()
        analysis_id = str(uuid.uuid4())

        # 1. Computer Vision Detection
        detections = self.detector.detect(image, conf_threshold=confidence_threshold)

        # 2. Deterministic Rule & Scoring Engine
        img_dims = (image.width, image.height)
        eval_result = AccessibilityEngine.analyze(detections, image_dimensions=img_dims)

        # 3. Optional Visualization
        annotated_image = None
        if generate_annotation:
            annotated_image = ImageAnnotator.annotate(image, detections)

        # Elapsed time in milliseconds
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return AnalysisResponse(
            success=True,
            analysis_id=analysis_id,
            accessibility_score=eval_result["score"],
            classification=eval_result["classification"],
            detections=detections,
            risks=eval_result["risks"],
            recommendations=eval_result["recommendations"],
            summary=eval_result["summary"],
            processing_time_ms=elapsed_ms,
            score_breakdown=eval_result["breakdown"],
            annotated_image=annotated_image,
        )
