"""Health check router"""
from fastapi import APIRouter
from core.config import settings

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "sd_base_url": settings.sd_base_url,
        "use_real_sd": settings.use_real_sd,
        "minio_endpoint": settings.minio_endpoint,
    }
