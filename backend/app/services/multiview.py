import time
import uuid
import logging
from typing import List, Optional
from PIL import Image

from app.schemas.analysis import (
    AnalysisResponse,
    MultiViewAnalysisResponse,
    Evidence,
    Risk,
    Recommendation,
    AccessibilityProfile,
    AssessmentConfidence,
    AssessmentStatus,
)
from app.services.analyzer import AccessibilityAnalyzer

logger = logging.getLogger(__name__)


class MultiViewFusionEngine:
    """
    Aggregates visual accessibility evidence across multiple camera viewpoints (1 to 3 images).
    Combines independent single-image analyses, fuses evidence without double-counting,
    and produces a comprehensive holistic site assessment.
    """

    def __init__(self, analyzer: Optional[AccessibilityAnalyzer] = None):
        self.analyzer = analyzer or AccessibilityAnalyzer()

    def analyze_views(
        self,
        images: List[Image.Image],
        confidence_threshold: Optional[float] = None,
        profile: AccessibilityProfile = "general_mobility",
    ) -> MultiViewAnalysisResponse:
        """
        Executes multi-view analysis across 1 to 3 images.
        """
        start_time = time.perf_counter()
        analysis_id = f"mv_{uuid.uuid4().hex[:12]}"

        # Cap at 3 images max
        active_images = images[:3]
        if not active_images:
            raise ValueError("At least one image is required for multi-view analysis.")

        individual_analyses: List[AnalysisResponse] = []
        for idx, img in enumerate(active_images):
            res = self.analyzer.analyze(
                image=img,
                confidence_threshold=confidence_threshold,
                profile=profile,
                generate_annotation=True,
            )
            # Label provenance
            res.analysis_id = f"view_{idx + 1}_{res.analysis_id}"
            individual_analyses.append(res)

        # -------------------------------------------------------------
        # EVIDENCE FUSION
        # -------------------------------------------------------------
        fused_evidence_map = {}
        for res in individual_analyses:
            for ev in res.evidence:
                key = ev.feature
                if key not in fused_evidence_map:
                    fused_evidence_map[key] = ev
                else:
                    existing = fused_evidence_map[key]
                    # If any viewpoint positively detected the feature, preserve detected status
                    if ev.status == "detected" and existing.status != "detected":
                        fused_evidence_map[key] = ev
                    elif ev.status == "detected" and existing.status == "detected":
                        # Pick higher confidence
                        max_conf = max(ev.confidence or 0.0, existing.confidence or 0.0)
                        existing.confidence = round(max_conf, 2)

        fused_evidence = list(fused_evidence_map.values())

        # -------------------------------------------------------------
        # RISKS & RECOMMENDATIONS FUSION (Deduplicated)
        # -------------------------------------------------------------
        seen_risk_types = set()
        fused_risks: List[Risk] = []
        for res in individual_analyses:
            for r in res.risks:
                if r.type not in seen_risk_types:
                    seen_risk_types.add(r.type)
                    fused_risks.append(r)

        seen_rec_texts = set()
        fused_recommendations: List[Recommendation] = []
        for res in individual_analyses:
            for rec in res.recommendations:
                if rec.text not in seen_rec_texts:
                    seen_rec_texts.add(rec.text)
                    fused_recommendations.append(rec)

        # -------------------------------------------------------------
        # UNCERTAINTIES FUSION
        # -------------------------------------------------------------
        fused_uncertainties_set = set()
        for res in individual_analyses:
            for u in res.uncertainties:
                fused_uncertainties_set.add(u)

        # If a ramp was detected in ANY viewpoint, remove ramp uncertainty!
        has_ramp_anywhere = any(
            e.feature == "Accessible Ramp" and e.status == "detected" for e in fused_evidence
        )
        if has_ramp_anywhere:
            fused_uncertainties = [
                u for u in fused_uncertainties_set if "ramp" not in u.lower()
            ]
        else:
            fused_uncertainties = list(fused_uncertainties_set)

        # -------------------------------------------------------------
        # FUSED SCORE CALCULATION
        # Weighted conservative minimum: critical barrier in one viewpoint restricts access,
        # but verified alternative approach balances the final score.
        # -------------------------------------------------------------
        individual_scores = [a.accessibility_score for a in individual_analyses]
        if has_ramp_anywhere:
            # If one view showed stairs but another verified a ramp approach, score improves
            fused_score = int(sum(individual_scores) / len(individual_scores))
        else:
            # Conservative minimum to protect mobility device users from hidden barriers
            fused_score = min(individual_scores)

        # Classification
        classification = self.analyzer.accessibility_engine.get_classification(fused_score)

        # Vision Confidence (mean of detected confidences)
        pos_confs = [
            a.vision_confidence for a in individual_analyses if a.vision_confidence is not None
        ]
        mean_vision_conf = round(sum(pos_confs) / len(pos_confs), 2) if pos_confs else None

        # Assessment Confidence increases with multi-angle coverage!
        # GLOBAL ENGINEERING RULE:
        # If all views are inconclusive / empty, the multi-view assessment MUST remain INCONCLUSIVE!
        all_inconclusive = all(a.assessment_status == "INCONCLUSIVE" for a in individual_analyses)
        any_inconclusive = any(a.assessment_status == "INCONCLUSIVE" for a in individual_analyses)
        has_any_detections = any(len(a.detections) > 0 for a in individual_analyses)

        if all_inconclusive or not has_any_detections:
            fused_status: AssessmentStatus = "INCONCLUSIVE"
            fused_status_reason = (
                f"Multi-view assessment INCONCLUSIVE across {len(active_images)} perspective(s): "
                "no physical objects or corridor entities detected in any view. "
                "Absence of detected barriers across viewpoints does not certify accessibility. On-site verification required."
            )
            assessment_confidence: AssessmentConfidence = "LOW"
        else:
            fused_status = "PRELIMINARY"
            fused_status_reason = (
                f"Preliminary multi-view evaluation synthesized across {len(active_images)} perspective(s)."
            )
            assessment_confidence = (
                "HIGH" if len(active_images) >= 2 else individual_analyses[0].assessment_confidence
            )

        view_count = len(active_images)
        if fused_status == "INCONCLUSIVE":
            summary = (
                f"Multi-View Assessment INCONCLUSIVE across {view_count} camera perspective(s). "
                f"Nominal score: {fused_score}/100 ({assessment_confidence} confidence). "
                "Insufficient visual evidence across evaluated angles to confirm accessibility."
            )
            speech_summary = (
                f"Multi-view assessment inconclusive across {view_count} perspectives. "
                "Insufficient visual evidence to verify accessibility. On-site inspection recommended."
            )
        else:
            summary = (
                f"Multi-View Preliminary Synthesis across {view_count} camera perspective(s). "
                f"Overall assessed as {classification.replace('_', ' ').title()} ({fused_score}/100, {assessment_confidence} confidence). "
                f"{'Stairs were observed in at least one viewpoint.' if any(r.type == 'STAIRS_BARRIER' for r in fused_risks) else 'No severe structural step barriers observed across perspectives.'}"
            )
            speech_summary = (
                f"Multi-view preliminary assessment across {view_count} perspectives. "
                f"Accessibility score {fused_score} out of 100, {classification.replace('_', ' ').title()}. "
                f"{fused_risks[0].description if fused_risks else 'No major barriers observed.'}"
            )

        total_elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return MultiViewAnalysisResponse(
            success=True,
            analysis_id=analysis_id,
            assessment_status=fused_status,
            assessment_status_reason=fused_status_reason,
            accessibility_score=fused_score,
            classification=classification,
            assessment_confidence=assessment_confidence,
            vision_confidence=mean_vision_conf,
            profile=profile,
            viewpoints_count=view_count,
            individual_analyses=individual_analyses,
            fused_evidence=fused_evidence,
            fused_risks=fused_risks,
            fused_recommendations=fused_recommendations,
            fused_uncertainties=fused_uncertainties,
            summary=summary,
            speech_summary=speech_summary,
            total_processing_time_ms=total_elapsed_ms,
        )
