#!/usr/bin/env python3
"""
Vision Analysis Tool — 我的视觉能力延伸
==========================================
通过 OpenRouter API 调用 NVIDIA Nemotron 3 Nano Omni 视觉模型分析图片。
这是目前唯一验证有效的免费多模态方案。

用法:
  python3 vision.py <图片路径> "分析问题"
  python3 vision.py /tmp/flower.png "这朵花有什么问题？"

依赖: requests
模型: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free (免费)
"""

import base64, json, sys, os

API_KEY = "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"
MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
API_URL = "https://openrouter.ai/api/v1/chat/completions"


def analyze_image(image_path: str, question: str, max_tokens: int = 500) -> str:
    """分析图片，返回模型回答"""

    # 读取并编码图片
    with open(image_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode()

    mime = "image/png"
    if image_path.lower().endswith((".jpg", ".jpeg")):
        mime = "image/jpeg"
    elif image_path.lower().endswith(".webp"):
        mime = "image/webp"

    # 调用 OpenRouter API
    resp = __import__("requests").post(
        API_URL,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/OpenClaw",
        },
        json={
            "model": MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": question},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime};base64,{img_b64}"
                            },
                        },
                    ],
                }
            ],
            "max_tokens": max_tokens,
        },
        timeout=120,
    )

    if resp.status_code != 200:
        return f"API 错误 (HTTP {resp.status_code}): {resp.text[:300]}"

    result = resp.json()
    msg = result["choices"][0]["message"]

    # Nemotron reasoning 模型把完整回复放在 reasoning 字段
    # content 通常为 null（token 被 reasoning 耗尽）
    text = msg.get("content") or msg.get("reasoning", "")

    if not text:
        text = f"(空响应) raw: {json.dumps(msg, ensure_ascii=False)[:300]}"

    return text.strip()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    image_path = sys.argv[1]
    question = sys.argv[2] if len(sys.argv) > 2 else "用中文简洁描述这张图片的内容"

    if not os.path.exists(image_path):
        print(f"❌ 文件不存在: {image_path}")
        sys.exit(1)

    print(f"🔍 {os.path.basename(image_path)}")
    print(f"❓ {question}")
    print(f"⏳ {MODEL} 分析中...")
    print("─" * 50)

    result = analyze_image(image_path, question, max_tokens=600)
    print(result)
    print("─" * 50)


if __name__ == "__main__":
    main()
