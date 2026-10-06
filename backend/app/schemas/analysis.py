from typing import List, Optional, Tuple, Literal
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

class Detection(BaseModel):
    class_name: str = Field(..., description="Name of the detected object class")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score")
    bbox: List[float] = Field(..., description="Bounding box coordinates [x1, y1, x2, y2] normalized or absolute")
    category: Optional[str] = Field("general", description="Semantic category (barrier, mobility_aid, vehicle, pedestrian, etc.)")

class Risk(BaseModel):
    type: str = Field(..., description="Category or identifier of the risk")
    severity: RiskSeverity = Field(..., description="Severity level of the risk")
    description: str = Field(..., description="Human-readable explanation of the risk")

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
    detections: List[Detection] = Field(default_factory=list)
    risks: List[Risk] = Field(default_factory=list)
    recommendations: List[Recommendation] = Field(default_factory=list)
    summary: str
    processing_time_ms: float
    score_breakdown: Optional[ScoreBreakdown] = None
    annotated_image: Optional[str] = Field(None, description="Base64 encoded annotated image with bounding boxes")
