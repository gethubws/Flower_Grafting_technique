"""Prompt Builder — SD Prompt 组装

将原子列表 + 珍稀度转换为 SD 自然语言 Prompt。
使用 animaPencilXL 风格。
"""

# 原子 → 自然语言映射
ATOM_DESCRIPTIONS: dict[str, str] = {
    # 颜色
    "红花": "red petals",
    "黄花": "yellow petals",
    "白花": "white petals",
    "鲜艳": "vibrant colors",
    "单色": "monochrome",
    "斑纹": "striped patterns",
    "异色": "unusual color gradient",
    # 形态
    "重瓣": "double-layered petals",
    "单瓣": "single-layered petals",
    "杯状": "cup-shaped bloom",
    "蝶形": "butterfly-shaped petals",
    "大花盘": "large flower disc",
    "圆形": "round bloom",
    "修长": "slender elegant form",
    "宽瓣": "wide petals",
    "层叠": "layered petals",
    # 特征
    "尖刺茎": "thorny stem",
    "高大茎": "tall stem",
    "直立茎": "upright stem",
    "细茎": "thin delicate stem",
    "香气1": "light fragrance",
    "香气2": "rich fragrance",
    "长花期": "long-lasting bloom",
    "光滑花瓣": "smooth glossy petals",
    "附生": "epiphytic growth",
    # 风格
    "柔和": "soft delicate appearance",
    "温暖": "warm inviting glow",
    "简洁": "minimalist elegant",
    "优雅": "elegant refined beauty",
    "热带": "tropical exotic feel",
    # 珍稀度系统词
    "光泽1": "subtle shimmer",
    "光泽2": "pearly luster",
    "光泽3": "radiant glow",
    "荧光": "bioluminescent glow",
    "虹彩": "iridescent rainbow sheen",
    "传说": "legendary mythical aura",
    # 语境
    "向阳": "sun-facing heliotropic",
    "早春": "early spring bloom",
    "棕色蕊": "brown center",
    "对称": "perfectly symmetrical",
}

# 珍稀度 → 品质词
RARITY_QUALIFIERS: dict[str, str] = {
    "N": "simple natural",
    "R": "charming delightful",
    "SR": "exquisite rare",
    "SSR": "magnificent extraordinary",
    "UR": "legendary mythical masterpiece",
}

# 负面提示词
NEGATIVE_PROMPT = (
    "ugly, deformed, blurry, low quality, text, watermark, signature, "
    "cropped, out of frame, bad anatomy, extra limbs, mutated, "
    "photorealistic, photograph, 3d render"
)


def build_prompt(atoms: list[str], rarity: str = "N") -> str:
    """将原子列表转为 SD 自然语言 prompt。"""
    # 翻译原子
    descriptions = []
    for atom in atoms[:10]:
        desc = ATOM_DESCRIPTIONS.get(atom, atom)
        if desc not in descriptions:  # 去重
            descriptions.append(desc)

    desc_str = ", ".join(descriptions) if descriptions else "a flower"

    qualifier = RARITY_QUALIFIERS.get(rarity, "beautiful")

    return (
        f"anime style, botanical illustration, {qualifier} flower, "
        f"{desc_str}, "
        f"clean composition, centered, white background, "
        f"masterpiece, high quality, detailed petals"
    )


def get_negative_prompt() -> str:
    return NEGATIVE_PROMPT
