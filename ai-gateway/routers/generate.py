"""Image generation router"""
import hashlib
import time
from io import BytesIO
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.config import settings
from services.placeholder import generate_placeholder
from services.minio_uploader import upload_image
from services.prompt_builder import build_prompt

router = APIRouter()


class GenerateRequest(BaseModel):
    prompt: str = ""
    seed: int = 42
    atoms: list[str] = []
    rarity: str = "N"
    stage: str = "BLOOMING"
    flower_id: str = ""
    user_id: str = ""
    width: int = 512
    height: int = 768


class GenerateResponse(BaseModel):
    success: bool
    flower_id: str
    image_url: str
    placeholder: bool = True  # Phase 1: always placeholder


@router.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    """
    Generate flower image.
    Phase 1: Always returns L3 placeholder.
    Phase 3+: Switches to real SD when USE_REAL_SD=true.
    """
    try:
        # Build full prompt from atoms
        full_prompt = req.prompt or build_prompt(req.atoms, req.rarity)

        # Generate placeholder image
        image_bytes = generate_placeholder(
            rarity=req.rarity,
            stage=req.stage,
            width=req.width,
            height=req.height,
        )

        # Upload to MinIO
        object_name = f"{req.user_id or 'unknown'}/{req.flower_id or hashlib.md5(str(time.time()).encode()).hexdigest()}.png"
        image_url = upload_image(object_name, image_bytes)

        return GenerateResponse(
            success=True,
            flower_id=req.flower_id,
            image_url=image_url,
            placeholder=True,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
