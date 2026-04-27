"""SD Adapter — Phase 1 Stub

Phase 1: Not activated (USE_REAL_SD=false).
Future: Communicates with SD Forge API.
"""
import httpx
from core.config import settings


async def generate_sd(
    prompt: str,
    seed: int,
    width: int = 512,
    height: int = 768,
) -> list[str]:
    """Call SD API, return list of base64 images."""
    if not settings.use_real_sd:
        raise RuntimeError("Real SD is disabled (USE_REAL_SD=false)")

    payload = {
        "prompt": prompt,
        "seed": seed,
        "width": width,
        "height": height,
        "steps": 20,
        "cfg_scale": 7,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            f"{settings.sd_base_url}/sdapi/v1/txt2img",
            json=payload,
        )
        r.raise_for_status()
        data = r.json()
        return data.get("images", [])
