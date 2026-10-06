import time
import uuid
import logging
from typing import Optional
from PIL import Image

from app.schemas.analysis import AnalysisResponse
from app.services.detector import Detector
from app.services.accessibility import AccessibilityEngine
from app.services.annotator import ImageAnnotator
from app.services.explanation import get_explanation_provider, ExplanationProvider

logger = logging.getLogger(__name__)


class AccessibilityAnalyzer:
    """
    Orchestrates end-to-end visual accessibility analysis:
    Image -> YOLOv8 Detection -> Evidence Extraction -> Rules Scoring -> OpenCV Annotation -> Explanation.
    """

    def __init__(
        self,
        detector: Optional[Detector] = None,
        explanation_provider: Optional[ExplanationProvider] = None,
    ):
        # Detector is initialized once and reused across all requests
        self.detector = detector or Detector()
        self.explanation_provider = explanation_provider or get_explanation_provider()

    def analyze(
        self,
        image: Image.Image,
        confidence_threshold: Optional[float] = None,
        generate_annotation: bool = True,
    ) -> AnalysisResponse:
        """
        Executes end-to-end evidence-aware physical accessibility analysis.
        """
        overall_start = time.perf_counter()
        analysis_id = f"wf_{uuid.uuid4().hex[:12]}"

        # 1. Computer Vision Detection (with precise inference timing)
        inference_start = time.perf_counter()
        detections = self.detector.detect(image, conf_threshold=confidence_threshold)
        inference_ms = round((time.perf_counter() - inference_start) * 1000, 2)

        # 2. Deterministic Rule & Evidence-Aware Scoring Engine
        img_dims = (image.width, image.height)
        eval_result = AccessibilityEngine.analyze(detections, image_dimensions=img_dims)

        # 3. Optional Annotation Visualization
        annotated_image = None
        if generate_annotation:
            annotated_image = ImageAnnotator.annotate(image, detections)

        # 4. Optional Explanation Refinement (Deterministic / LLM)
        evidence_texts = [f"{e.feature}: {e.status}" for e in eval_result["evidence"]]
        risk_texts = [r.description for r in eval_result["risks"]]
        base_rec_texts = [r.text for r in eval_result["recommendations"]]

        explanation = self.explanation_provider.generate_explanation(
            score=eval_result["score"],
            classification=eval_result["classification"],
            evidence_summary=evidence_texts,
            risks_summary=risk_texts,
            uncertainties=eval_result["uncertainties"],
            base_recommendations=base_rec_texts,
        )

        # Use refined insight in summary if available
        final_summary = explanation.get("ai_insight") or eval_result["summary"]

        overall_ms = round((time.perf_counter() - overall_start) * 1000, 2)

        return AnalysisResponse(
            success=True,
            analysis_id=analysis_id,
            accessibility_score=eval_result["score"],
            classification=eval_result["classification"],
            assessment_confidence=eval_result["assessment_confidence"],
            assessment_scope=eval_result["assessment_scope"],
            detections=detections,
            evidence=eval_result["evidence"],
            risks=eval_result["risks"],
            recommendations=eval_result["recommendations"],
            uncertainties=eval_result["uncertainties"],
            summary=final_summary,
            processing_time_ms=overall_ms,
            inference_time_ms=inference_ms,
            score_breakdown=eval_result["breakdown"],
            annotated_image=annotated_image,
        )
