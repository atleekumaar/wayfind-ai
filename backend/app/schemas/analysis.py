from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

# Accessibility classification constants
FULLY_ACCESSIBLE = "FULLY_ACCESSIBLE"
MOSTLY_ACCESSIBLE = "MOSTLY_ACCESSIBLE"
PARTIALLY_ACCESSIBLE = "PARTIALLY_ACCESSIBLE"
LIMITED_ACCESSIBILITY = "LIMITED_ACCESSIBILITY"

AccessibilityClassification = Literal[
    "FULLY_ACCESSIBLE",
    "MOSTLY_ACCESSIBLE",
    "PARTIALLY_ACCESSIBLE",
    "LIMITED_ACCESSIBILITY"
]

RiskSeverity = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
RecommendationPriority = Literal["LOW", "MEDIUM", "HIGH"]
AssessmentConfidence = Literal["HIGH", "MEDIUM", "LOW"]
AssessmentStatus = Literal["PRELIMINARY", "INCONCLUSIVE", "ASSESSED"]
EvidenceSufficiency = Literal["sufficient_evidence", "limited_evidence", "insufficient_evidence", "analysis_failed"]

EvidenceStatus = Literal["detected", "inferred", "unknown", "not_detected"]
EvidenceSource = Literal[
    "object_detection",
    "segmentation",
    "depth_estimation",
    "scene_reasoning",
    "spatial_corridor_analysis",
    "rule_engine",
    "unsupported"
]

AccessibilityProfile = Literal[
    "general_mobility",
    "wheelchair",
    "walker",
    "stroller",
    "low_vision"
]


class Detection(BaseModel):
    id: Optional[str] = Field(None, description="Unique detection instance ID for score traceability")
    class_name: str = Field(..., description="Name of the detected object class")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score")
    bbox: List[float] = Field(..., description="Bounding box coordinates [x1, y1, x2, y2]")
    category: Optional[str] = Field("general", description="Semantic category (barrier, mobility_aid, vehicle, pedestrian, etc.)")
    source_model: Optional[str] = Field("yolov8n-coco", description="Origin model checkpoint")
    is_model_supported: bool = Field(True, description="Whether the class is native to the active model checkpoint")
    detection_status: Literal["detected", "inferred", "unknown", "unsupported"] = Field("detected", description="Detection status")
    limitations: Optional[str] = Field(None, description="Model or viewpoint limitations for this detection")
    viewpoint_index: int = Field(0, description="Viewpoint index for multi-view traceability")


class SpatialAssessment(BaseModel):
    class_name: str = Field(..., description="Object class evaluated")
    bbox: List[float] = Field(..., description="Object bounding box")
    relation_to_path: Literal["inside_navigation_corridor", "boundary_corridor", "outside_navigation_corridor"] = Field(
        ..., description="Geometric relationship to the inferred pedestrian corridor"
    )
    overlap_ratio: float = Field(..., ge=0.0, le=1.0, description="Proportion of overlap with the navigation corridor")
    proximity_level: Literal["immediate_foreground", "midground_corridor", "background_context"] = Field(
        ..., description="Depth tier based on vertical position in image-space"
    )
    navigation_relevance: Literal["corridor_obstruction", "pathway_restriction", "contextual_outside_corridor"] = Field(
        ..., description="Relevance to pedestrian accessibility navigation"
    )
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence of spatial relationship inference")
    explanation: str = Field(..., description="Responsible, evidence-grounded spatial explanation")


class Evidence(BaseModel):
    feature: str = Field(..., description="Environmental or accessibility feature name (e.g. stairs, ramp, obstacle)")
    status: EvidenceStatus = Field(..., description="Evidence verification status: detected, inferred, unknown, not_detected")
    source: EvidenceSource = Field(..., description="Origin of verification: object_detection, scene_reasoning, unsupported, etc.")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Confidence level if directly measurable")
    description: Optional[str] = Field(None, description="Contextual explanation of what was observed or why it is unknown")


class Risk(BaseModel):
    type: str = Field(..., description="Category or identifier of the risk")
    severity: RiskSeverity = Field(..., description="Severity level of the risk")
    description: str = Field(..., description="Responsible, evidence-qualified explanation of the risk")


class Recommendation(BaseModel):
    priority: RecommendationPriority = Field(..., description="Priority level of the recommendation")
    text: str = Field(..., description="Actionable advice for navigation or accessibility")


class ScoreBreakdownFactor(BaseModel):
    factor: str = Field(..., description="Rule factor description")
    points: int = Field(..., description="Point delta (positive or negative)")
    category: str = Field(..., description="Semantic category (stairs, obstacle, vehicle, ramp, path)")
    status: EvidenceStatus = Field("detected", description="Underlying evidence status")
    source: str = Field("rule_engine", description="Source of factor derivation")
    confidence: Optional[float] = Field(None, description="Factor confidence if applicable")
    detection_id: Optional[str] = Field(None, description="Linked detection instance ID for visual traceability")
    rule_name: Optional[str] = Field(None, description="Specific deterministic rule key applied")
    spatial_relevance: Optional[str] = Field(None, description="Corridor relevance tier (corridor_obstruction, boundary, contextual)")


class ScoreBreakdown(BaseModel):
    base_score: int = Field(100, description="Starting score before rule adjustments")
    penalties: int = Field(0, description="Total penalty points subtracted")
    rewards: int = Field(0, description="Total positive points added")
    factors: List[str] = Field(default_factory=list, description="Legacy list of factor strings")
    detailed_factors: List[ScoreBreakdownFactor] = Field(default_factory=list, description="Structured factor objects")


class AnalysisResponse(BaseModel):
    success: bool = True
    analysis_id: str
    assessment_status: AssessmentStatus = Field("PRELIMINARY", description="Operational assessment status: PRELIMINARY, INCONCLUSIVE, or ASSESSED")
    assessment_status_reason: Optional[str] = Field(None, description="Detailed rationale if assessment is INCONCLUSIVE or PRELIMINARY")
    accessibility_score: int = Field(..., ge=0, le=100, description="Overall accessibility score between 0 and 100")
    classification: AccessibilityClassification
    assessment_confidence: AssessmentConfidence = Field("MEDIUM", description="Confidence in assessment based on visual coverage")
    vision_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Average detector confidence of positive visual detections")
    evidence_sufficiency: EvidenceSufficiency = Field("sufficient_evidence", description="Evidence sufficiency evaluation tier")
    assessment_scope: str = Field("visible_area_only", description="Scope of visual assessment")
    profile: AccessibilityProfile = Field("general_mobility", description="Active accessibility evaluation profile")
    image_source_label: str = Field("USER_IMAGE", description="Label: USER_IMAGE or CURATED_DEMO_SCENE_SYNTHETIC")
    viewpoints_analyzed: int = Field(1, ge=1, le=3, description="Number of visual perspectives evaluated")
    
    detections: List[Detection] = Field(default_factory=list)
    spatial_assessments: List[SpatialAssessment] = Field(default_factory=list, description="Spatial navigation corridor assessments")
    evidence: List[Evidence] = Field(default_factory=list)
    risks: List[Risk] = Field(default_factory=list)
    recommendations: List[Recommendation] = Field(default_factory=list)
    uncertainties: List[str] = Field(default_factory=list, description="Explicit statements of what cannot be determined from the image")
    
    summary: str
    speech_summary: Optional[str] = Field(None, description="Concise text optimized for browser text-to-speech read-aloud")
    processing_time_ms: float
    inference_time_ms: Optional[float] = Field(None, description="ML inference time in milliseconds")
    hardware_runtime: str = Field("CPU", description="Runtime execution target (CPU, etc.)")
    score_breakdown: Optional[ScoreBreakdown] = None
    annotated_image: Optional[str] = Field(None, description="Base64 encoded annotated image with bounding boxes")


class MultiViewAnalysisResponse(BaseModel):
    success: bool = True
    analysis_id: str
    assessment_status: AssessmentStatus = Field("PRELIMINARY", description="Aggregated multi-view assessment status")
    assessment_status_reason: Optional[str] = Field(None, description="Rationale for aggregated assessment status")
    accessibility_score: int = Field(..., ge=0, le=100)
    classification: AccessibilityClassification
    assessment_confidence: AssessmentConfidence
    vision_confidence: Optional[float] = None
    profile: AccessibilityProfile = "general_mobility"
    viewpoints_count: int = Field(..., ge=1, le=3)
    individual_analyses: List[AnalysisResponse] = Field(default_factory=list)
    fused_evidence: List[Evidence] = Field(default_factory=list)
    fused_risks: List[Risk] = Field(default_factory=list)
    fused_recommendations: List[Recommendation] = Field(default_factory=list)
    fused_uncertainties: List[str] = Field(default_factory=list)
    summary: str
    speech_summary: Optional[str] = None
    total_processing_time_ms: float
