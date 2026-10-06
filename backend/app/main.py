import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.routes import router as api_router, get_analyzer

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("wayfind-backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: preload detector model
    logger.info("Initializing WAYFIND AI backend...")
    analyzer = get_analyzer()
    if analyzer.detector.is_loaded:
        logger.info("Detector preloaded with %d classes.", len(analyzer.detector.get_supported_classes()))
    else:
        logger.warning("Detector running without pretrained model weights.")
    yield
    logger.info("Shutting down WAYFIND AI backend...")


app = FastAPI(
    title="WAYFIND AI — Accessibility Intelligence API",
    description="Analyzes physical environment images and estimates accessibility with deterministic scoring.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for hackathon development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error processing request %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "InternalServerError",
            "message": "An unexpected error occurred while processing the request. Please try again."
        },
    )


@app.get("/health", summary="Health check endpoint")
def health_check():
    """Returns service health status."""
    return {
        "status": "ok",
        "service": "wayfind-ai"
    }


# Include v1 API routes
app.include_router(api_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
