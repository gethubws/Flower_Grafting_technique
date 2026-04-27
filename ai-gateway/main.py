import os
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="FlowerLang AI Gateway")

SD_BASE_URL = os.getenv("SD_BASE_URL", "http://10.16.52.202:7860")

class FusionRequest(BaseModel):
    prompt: str
    seed: int
    atoms: List[str]
    width: int = 512
    height: int = 768

@app.get("/health")
async def health():
    return {"status": "ok", "sd": SD_BASE_URL}

@app.post("/generate")
async def generate(req: FusionRequest):
    """调用本地 SD API 生成透明底花卉图"""
    payload = {
        "prompt": req.prompt,
        "seed": req.seed,
        "width": req.width,
        "height": req.height,
        "steps": 20,
        "cfg_scale": 7,
        # 若使用 LayerDiffusion / ControlNet，在此扩展 payload
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(f"{SD_BASE_URL}/sdapi/v1/txt2img", json=payload)
            r.raise_for_status()
            data = r.json()
            return {
                "success": True,
                "images": data.get("images", []),
                "parameters": data.get("parameters", {})
            }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"SD API error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
