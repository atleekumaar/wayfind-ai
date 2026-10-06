from typing import List, Optional, Literal
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

EvidenceStatus = Literal["detected", "inferred", "unknown", "not_detected"]
EvidenceSource = Literal[
    "object_detection",
    "segmentation",
    "depth_estimation",
    "scene_reasoning",
    "rule_engine",
    "unsupported"
]


class Detection(BaseModel):
    class_name: str = Field(..., description="Name of the detected object class")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score")
    bbox: List[float] = Field(..., description="Bounding box coordinates [x1, y1, x2, y2]")
    category: Optional[str] = Field("general", description="Semantic category (barrier, mobility_aid, vehicle, pedestrian, etc.)")


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


class ScoreBreakdown(BaseModel):
    base_score: int = Field(100, description="Starting score before rule adjustments")
    penalties: int = Field(0, description="Total penalty points subtracted")
    rewards: int = Field(0, description="Total positive points added")
    factors: List[str] = Field(default_factory=list, description="List of scoring factors applied")


class AnalysisResponse(BaseModel):
    success: bool = True
    analysis_id: str
    accessibility_score: int = Field(..., ge=0, le=100, description="Overall accessibility score between 0 and 100")
    classification: AccessibilityClassification
    assessment_confidence: AssessmentConfidence = Field("MEDIUM", description="Confidence in assessment based on visual coverage")
    assessment_scope: str = Field("visible_area_only", description="Scope of visual assessment")
    
    detections: List[Detection] = Field(default_factory=list)
    evidence: List[Evidence] = Field(default_factory=list)
    risks: List[Risk] = Field(default_factory=list)
    recommendations: List[Recommendation] = Field(default_factory=list)
    uncertainties: List[str] = Field(default_factory=list, description="Explicit statements of what cannot be determined from the image")
    
    summary: str
    processing_time_ms: float
    inference_time_ms: Optional[float] = Field(None, description="ML inference time in milliseconds")
    score_breakdown: Optional[ScoreBreakdown] = None
    annotated_image: Optional[str] = Field(None, description="Base64 encoded annotated image with bounding boxes")
