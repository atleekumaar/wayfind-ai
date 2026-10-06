import logging
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Query, Depends

from app.schemas.analysis import AnalysisResponse
from app.services.analyzer import AccessibilityAnalyzer
from app.utils.image import validate_and_load_image

logger = logging.getLogger(__name__)

router = APIRouter()

# Global analyzer instance (loaded once on startup)
_analyzer: Optional[AccessibilityAnalyzer] = None


def get_analyzer() -> AccessibilityAnalyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = AccessibilityAnalyzer()
    return _analyzer


@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    summary="Analyze physical environment image for accessibility",
    description="Accepts an image, detects environmental entities via YOLO, scores accessibility, and returns risks and recommendations."
)
async def analyze_environment(
    image: UploadFile = File(..., description="Uploaded image file (JPEG, PNG, WebP)"),
    confidence_threshold: Optional[float] = Query(
        None,
        ge=0.05,
        le=0.95,
        description="Optional minimum detection confidence override (0.05 - 0.95)",
    ),
    analyzer: AccessibilityAnalyzer = Depends(get_analyzer),
) -> AnalysisResponse:
    """Processes image and computes physical accessibility score and risk evaluation."""
    validated_image = await validate_and_load_image(image)
    
    result = analyzer.analyze(
        image=validated_image,
        confidence_threshold=confidence_threshold,
        generate_annotation=True,
    )
    return result


@router.get(
    "/classes",
    summary="Get supported detection classes",
    description="Returns the list of classes supported by the active computer vision model."
)
def get_supported_classes(analyzer: AccessibilityAnalyzer = Depends(get_analyzer)):
    classes = analyzer.detector.get_supported_classes()
    return {
        "count": len(classes),
        "model": analyzer.detector.model_path,
        "classes": classes
    }
