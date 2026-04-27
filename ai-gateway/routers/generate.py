"""Image generation router"""
import hashlib
import time
import base64
from io import BytesIO
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.config import settings
from services.placeholder import generate_placeholder
from services.minio_uploader import upload_image
from services.prompt_builder import build_prompt, get_negative_prompt
from services.sd_adapter import generate_sd, generate_ui_asset
from services.image_processor import process_flower_image, optimize_for_web

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
    transparent: bool = True  # Use LayerDiffuse for transparent BG


class GenerateResponse(BaseModel):
    success: bool
    flower_id: str
    image_url: str
    placeholder: bool = True


class BackgroundRequest(BaseModel):
    width: int = 1024
    height: int = 768
    seed: int = 42


class UIAssetRequest(BaseModel):
    asset_type: str = "panel"  # panel, button, card, toolbar
    width: int = 512
    height: int = 512
    seed: int = 42


@router.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    """
    Generate flower image.
    Uses LayerDiffuse for transparent background when USE_REAL_SD=true.
    """
    try:
        full_prompt = req.prompt or build_prompt(req.atoms, req.rarity)

        if settings.use_real_sd:
            images = await generate_sd(
                prompt=full_prompt,
                negative_prompt=get_negative_prompt(),
                seed=req.seed,
                width=req.width,
                height=req.height,
                transparent=req.transparent,
            )
            if not images:
                raise RuntimeError("SD returned no images")
            image_bytes = base64.b64decode(images[0])

            # Post-process: remove dark background → transparent + crop
            image_bytes = process_flower_image(image_bytes, remove_bg=req.transparent, crop=True)
            # Resize for web display
            image_bytes = optimize_for_web(image_bytes, max_width=256, max_height=384)
            is_placeholder = False
        else:
            image_bytes = generate_placeholder(
                rarity=req.rarity,
                stage=req.stage,
                width=req.width,
                height=req.height,
            )
            is_placeholder = True

        object_name = f"{req.user_id or 'unknown'}/{req.flower_id or hashlib.md5(str(time.time()).encode()).hexdigest()}.png"
        image_url = upload_image(object_name, image_bytes)

        return GenerateResponse(
            success=True,
            flower_id=req.flower_id,
            image_url=image_url,
            placeholder=is_placeholder,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.post("/generate-background")
async def generate_background(req: BackgroundRequest):
    """Generate garden background image for Phaser canvas."""
    try:
        prompt = (
            "masterpiece, best quality, beautiful fantasy garden background, "
            "peaceful nature scene, green grass field, blue sky with soft clouds, "
            "wooden fence in background, colorful flowers blooming, warm sunlight rays, "
            "game background art, painterly anime style, vibrant colors, peaceful atmosphere, "
            "no text, no UI elements, no characters"
        )
        negative = "blurry, low quality, worst quality, nsfw, text, watermark, signature, dark, gloomy"

        if settings.use_real_sd:
            images = await generate_sd(
                prompt=prompt,
                negative_prompt=negative,
                seed=req.seed,
                width=req.width,
                height=req.height,
                transparent=False,
            )
            if not images:
                raise RuntimeError("SD returned no images")
            image_bytes = base64.b64decode(images[0])
        else:
            image_bytes = generate_placeholder("N", "BLOOMING", req.width, req.height)

        object_name = f"assets/bg-garden-{int(time.time())}.png"
        image_url = upload_image(object_name, image_bytes)
        return {"success": True, "image_url": image_url, "placeholder": not settings.use_real_sd}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background generation failed: {str(e)}")


@router.post("/generate-ui-asset")
async def generate_ui_asset_endpoint(req: UIAssetRequest):
    """Generate UI asset (panel bg, button, card, toolbar) with SD."""
    try:
        prompts = {
            "panel": (
                "ornate fantasy UI panel background, dark mystical theme with subtle gold trim, "
                "elegant border decorations, stained glass fragments, floral vine ornaments at corners, "
                "semi-transparent dark background, game UI element, RPG inventory panel style, "
                "parchment texture with magical glow edges, no text"
            ),
            "card": (
                "fantasy card frame, elegant dark theme with golden border, "
                "floral vine decorations at corners, subtle glow effect, "
                "RPG item card background, mystical atmosphere, no text"
            ),
            "button": (
                "fantasy UI button, ornate golden border, polished gem-like surface, "
                "dark purple gradient, glowing edges, game button asset, "
                "circular or rounded rectangular, no text"
            ),
            "toolbar": (
                "fantasy UI toolbar background, horizontal bar, dark wood and gold trim, "
                "RPG game bottom bar, elegant simple design, subtle magical glow, "
                "ornate ends with vine motifs, no text, no buttons"
            ),
        }

        prompt = prompts.get(req.asset_type, prompts["panel"])
        negative = "blurry, low quality, worst quality, nsfw, text, watermark, signature, realistic photo, 3D render"

        if settings.use_real_sd:
            image_b64 = await generate_ui_asset(
                prompt=prompt,
                width=req.width,
                height=req.height,
                seed=req.seed,
            )
            if not image_b64:
                raise RuntimeError("SD returned no image")
            image_bytes = base64.b64decode(image_b64)
        else:
            image_bytes = generate_placeholder("N", "BLOOMING", req.width, req.height)

        object_name = f"assets/ui-{req.asset_type}-{int(time.time())}.png"
        image_url = upload_image(object_name, image_bytes)
        return {"success": True, "image_url": image_url, "asset_type": req.asset_type}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"UI asset generation failed: {str(e)}")
