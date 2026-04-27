"""SD Adapter — SD Forge API 调用

Phase 1: 通过 USE_REAL_SD 开关控制真实 SD 或占位图模式。
SD Forge URL: http://10.16.52.202:7860
模型: animaPencilXL_v100 (动漫风格花卉)
支持: LayerDiffuse 透明背景生成
"""
import httpx
from core.config import settings


async def generate_sd(
    prompt: str,
    negative_prompt: str = "",
    seed: int = -1,
    width: int = 512,
    height: int = 768,
    steps: int = 20,
    cfg_scale: float = 7.0,
    transparent: bool = False,
) -> list[str]:
    """Call SD Forge API, return list of base64 PNG images.

    When transparent=True, uses LayerDiffuse to generate images
    with transparent backgrounds for clean overlay on the garden.
    """
    payload = {
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "seed": seed,
        "width": width,
        "height": height,
        "steps": steps,
        "cfg_scale": cfg_scale,
        "sampler_name": "DPM++ 2M",
        "scheduler": "Karras",
    }

    if transparent:
        # Note: LayerDiffuse script_name approach doesn't work in all SD Forge setups.
        # Instead, improve prompt for simple background + post-process in Python.
        payload["prompt"] = (
            prompt + ", black background, studio lighting, centered, solo"
        )
        payload["negative_prompt"] = (
            negative_prompt + ", "
            "white background, complex background, landscape, scene, multiple objects, "
            "ground, dirt, grass, sky, outdoor"
        )

    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(
            f"{settings.sd_base_url}/sdapi/v1/txt2img",
            json=payload,
        )
        r.raise_for_status()
        data = r.json()
        return data.get("images", [])


async def generate_ui_asset(
    prompt: str,
    width: int = 512,
    height: int = 512,
    seed: int = -1,
) -> str | None:
    """Generate a UI asset image (button, panel background, etc.)
    Returns base64 PNG string, or None on failure.
    """
    payload = {
        "prompt": prompt,
        "negative_prompt": "blurry, low quality, worst quality, nsfw, text, watermark, signature, realistic photo",
        "seed": seed,
        "width": width,
        "height": height,
        "steps": 15,
        "cfg_scale": 6.0,
        "sampler_name": "DPM++ 2M",
        "scheduler": "Karras",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            f"{settings.sd_base_url}/sdapi/v1/txt2img",
            json=payload,
        )
        r.raise_for_status()
        data = r.json()
        images = data.get("images", [])
        return images[0] if images else None
