import os
from typing import List

class Settings:
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    ALLOWED_ORIGINS: List[str] = os.getenv(
        "WAYFIND_ALLOWED_ORIGINS",
        os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,*")
    ).split(",")
    MODEL_PATH: str = os.getenv("MODEL_PATH", "yolov8n.pt")
    DEFAULT_CONFIDENCE: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.30"))
    MAX_IMAGE_SIZE_BYTES: int = int(os.getenv("MAX_IMAGE_SIZE_MB", "10")) * 1024 * 1024
    ALLOWED_MIME_TYPES: List[str] = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]

settings = Settings()
