import io
from typing import Tuple
from PIL import Image
from fastapi import HTTPException, status, UploadFile

from app.config import settings


async def validate_and_load_image(file: UploadFile) -> Image.Image:
    """
    Validates uploaded file MIME type, size, and image integrity.
    Returns a verified PIL Image in RGB format.
    Raises HTTPException with clear status codes on failure.
    """
    # 1. Validate content type
    if file.content_type not in settings.ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{file.content_type}'. Supported formats: JPEG, PNG, WEBP.",
        )

    # 2. Read bytes and check size
    content = await file.read()
    if len(content) > settings.MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Image exceeds maximum allowed size of {settings.MAX_IMAGE_SIZE_BYTES // (1024 * 1024)}MB.",
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # 3. Verify PIL can parse the image without corruption
    try:
        image = Image.open(io.BytesIO(content))
        image.verify()  # Verifies file integrity
        # Re-open because verify() closes/invalidates the file handle
        image = Image.open(io.BytesIO(content))
        image.load()
        return image
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Corrupted or invalid image data: {str(e)}",
        )
