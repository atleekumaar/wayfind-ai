import time
import uuid
import logging
from typing import Optional
from PIL import Image

from app.schemas.analysis import AnalysisResponse, AccessibilityProfile
from app.services.detector import Detector
from app.services.accessibility import AccessibilityEngine
from app.services.annotator import ImageAnnotator
from app.services.explanation import get_explanation_provider, ExplanationProvider

logger = logging.getLogger(__name__)


class AccessibilityAnalyzer:
    """
    Orchestrates end-to-end visual accessibility analysis:
    Image -> YOLOv8 Detection -> Spatial Corridor Localization -> Evidence Extraction -> Profile-Aware Rules -> Annotation.
    """

    def __init__(
        self,
        detector: Optional[Detector] = None,
        explanation_provider: Optional[ExplanationProvider] = None,
    ):
        self.detector = detector or Detector()
        self.explanation_provider = explanation_provider or get_explanation_provider()
        self.accessibility_engine = AccessibilityEngine

    def analyze(
        self,
        image: Image.Image,
        confidence_threshold: Optional[float] = None,
        profile: AccessibilityProfile = "general_mobility",
        generate_annotation: bool = True,
        image_source_label: str = "USER_IMAGE",
    ) -> AnalysisResponse:
        """
        Executes end-to-end evidence-aware physical accessibility analysis.
        """
        overall_start = time.perf_counter()
        analysis_id = f"wf_{uuid.uuid4().hex[:12]}"

        # 1. Computer Vision Detection
        inference_start = time.perf_counter()
        detections = self.detector.detect(image, conf_threshold=confidence_threshold)
        inference_ms = round((time.perf_counter() - inference_start) * 1000, 2)

        # 2. Deterministic Rule & Spatial Evidence-Aware Scoring Engine
        img_dims = (image.width, image.height)
        eval_result = self.accessibility_engine.analyze(
            detections=detections,
            image_dimensions=img_dims,
            profile=profile,
        )

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

        final_summary = explanation.get("ai_insight") or eval_result["summary"]
        overall_ms = round((time.perf_counter() - overall_start) * 1000, 2)

        return AnalysisResponse(
            success=True,
            analysis_id=analysis_id,
            assessment_status=eval_result.get("assessment_status", "PRELIMINARY"),
            assessment_status_reason=eval_result.get("assessment_status_reason"),
            accessibility_score=eval_result["score"],
            classification=eval_result["classification"],
            assessment_confidence=eval_result["assessment_confidence"],
            vision_confidence=eval_result["vision_confidence"],
            evidence_sufficiency=eval_result.get("evidence_sufficiency", "sufficient_evidence"),
            assessment_scope=eval_result["assessment_scope"],
            profile=profile,
            image_source_label=image_source_label,
            viewpoints_analyzed=1,
            detections=detections,
            spatial_assessments=eval_result["spatial_assessments"],
            evidence=eval_result["evidence"],
            risks=eval_result["risks"],
            recommendations=eval_result["recommendations"],
            uncertainties=eval_result["uncertainties"],
            summary=final_summary,
            speech_summary=eval_result["speech_summary"],
            processing_time_ms=overall_ms,
            inference_time_ms=inference_ms,
            hardware_runtime="CPU",
            score_breakdown=eval_result["breakdown"],
            annotated_image=annotated_image,
        )
