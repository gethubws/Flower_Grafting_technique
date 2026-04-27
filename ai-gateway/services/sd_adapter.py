"""SD Adapter — SD Forge API 调用

Phase 1: 通过 USE_REAL_SD 开关控制真实 SD 或占位图模式。
SD Forge URL: http://10.16.52.202:7860
模型: animaPencilXL_v100 (动漫风格花卉)
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
) -> list[str]:
    """Call SD Forge API, return list of base64 PNG images."""
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

    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(
            f"{settings.sd_base_url}/sdapi/v1/txt2img",
            json=payload,
        )
        r.raise_for_status()
        data = r.json()
        return data.get("images", [])
