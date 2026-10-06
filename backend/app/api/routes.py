import logging
from typing import Optional, List
from fastapi import APIRouter, File, UploadFile, Query, Depends, HTTPException, status

from app.schemas.analysis import (
    AnalysisResponse,
    MultiViewAnalysisResponse,
    AccessibilityProfile,
)
from app.services.analyzer import AccessibilityAnalyzer
from app.services.multiview import MultiViewFusionEngine
from app.utils.image import validate_and_load_image

logger = logging.getLogger(__name__)

router = APIRouter()

# Global analyzer instance
_analyzer: Optional[AccessibilityAnalyzer] = None
_multiview_engine: Optional[MultiViewFusionEngine] = None


def get_analyzer() -> AccessibilityAnalyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = AccessibilityAnalyzer()
    return _analyzer


def get_multiview_engine(
    analyzer: AccessibilityAnalyzer = Depends(get_analyzer),
) -> MultiViewFusionEngine:
    global _multiview_engine
    if _multiview_engine is None:
        _multiview_engine = MultiViewFusionEngine(analyzer=analyzer)
    return _multiview_engine


@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    summary="Analyze physical environment image for accessibility",
    description="Accepts an image and mobility profile, detects environmental entities via YOLO, scores accessibility, and returns spatial risks and recommendations."
)
async def analyze_environment(
    image: UploadFile = File(..., description="Uploaded image file (JPEG, PNG, WebP)"),
    confidence_threshold: Optional[float] = Query(
        None,
        ge=0.05,
        le=0.95,
        description="Optional minimum detection confidence override (0.05 - 0.95)",
    ),
    profile: AccessibilityProfile = Query(
        "general_mobility",
        description="Target accessibility mobility profile (general_mobility, wheelchair, walker, stroller, low_vision)",
    ),
    image_source_label: str = Query(
        "USER_IMAGE",
        description="Source identifier (USER_IMAGE or CURATED_DEMO_SCENE_SYNTHETIC)",
    ),
    analyzer: AccessibilityAnalyzer = Depends(get_analyzer),
) -> AnalysisResponse:
    """Processes image and computes physical accessibility score and risk evaluation."""
    validated_image = await validate_and_load_image(image)
    
    result = analyzer.analyze(
        image=validated_image,
        confidence_threshold=confidence_threshold,
        profile=profile,
        generate_annotation=True,
        image_source_label=image_source_label,
    )
    return result


@router.post(
    "/analyze-multiview",
    response_model=MultiViewAnalysisResponse,
    summary="Multi-view accessibility evidence fusion across 1 to 3 images",
    description="Analyzes multiple perspectives of an entrance or pathway and fuses visual accessibility evidence into a unified assessment."
)
async def analyze_multiview(
    images: List[UploadFile] = File(..., description="1 to 3 images of the environment"),
    confidence_threshold: Optional[float] = Query(
        None,
        ge=0.05,
        le=0.95,
        description="Optional minimum detection confidence override",
    ),
    profile: AccessibilityProfile = Query(
        "general_mobility",
        description="Target accessibility mobility profile",
    ),
    multiview_engine: MultiViewFusionEngine = Depends(get_multiview_engine),
) -> MultiViewAnalysisResponse:
    """Executes multi-view visual evidence fusion across up to 3 perspectives."""
    if not images or len(images) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one image is required for multi-view analysis.",
        )

    if len(images) > 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum of 3 images supported per multi-view analysis.",
        )

    validated_images = []
    for img in images:
        v_img = await validate_and_load_image(img)
        validated_images.append(v_img)

    result = multiview_engine.analyze_views(
        images=validated_images,
        confidence_threshold=confidence_threshold,
        profile=profile,
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
        "classes": classes,
        "model_supported_classes": classes,
        "specialized_features_unsupported_by_coco": [
            "stairs", "ramp", "tactile_paving", "curb_cut", "door_width", "slope"
        ]
    }
