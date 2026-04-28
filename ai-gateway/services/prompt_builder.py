"""Prompt Builder — SD Prompt 组装

将结构化原子列表 + 珍稀度转换为 SD 自然语言 Prompt。
使用 animaPencilXL 风格。
"""

# 珍稀度 → 品质词
RARITY_QUALIFIERS: dict[str, str] = {
    "N": "simple natural",
    "R": "charming delightful",
    "SR": "exquisite rare",
    "SSR": "magnificent extraordinary",
    "UR": "legendary mythical masterpiece",
}

# 分类 → SD prompt 拼接顺序（越靠前的越先出现）
CATEGORY_ORDER = [
    "size", "petal_shape", "petal_color", "petal_texture",
    "stamen", "leaf_shape", "stem_type", "fragrance", "special",
]

# 负面提示词
NEGATIVE_PROMPT = (
    "ugly, deformed, blurry, low quality, text, watermark, signature, "
    "cropped, out of frame, bad anatomy, extra limbs, mutated, "
    "photorealistic, photograph, 3d render"
)

# 生长阶段提示词修饰
STAGE_MODIFIERS: dict[str, str] = {
    "seed": (
        "a single small seed resting on fresh soil, "
        "tiny and round, new beginning, simple clean"
    ),
    "seedling": (
        "young seedling just sprouting from soil, "
        "two tiny green leaves, delicate stem, fresh morning light"
    ),
    "growing": (
        "young plant with developing small flower bud, "
        "green leaves, stem growing taller, healthy vibrant plant"
    ),
    "mature": (
        "plant with large closed flower bud about to bloom, "
        "full green foliage, anticipation, ready to blossom"
    ),
    "blooming": (
        "fully bloomed flower in full glory, "
        "open petals, vibrant colors, peak beauty"
    ),
}


def build_prompt(atoms, rarity: str = "N") -> str:
    """将原子列表转为 SD 自然语言 prompt。
    
    atoms 可以是旧格式 string[] 或新格式 [{id, prompt_en, category, ...}]。
    """
    parts = []

    # 按分类整理
    categorized = {}
    for atom in atoms:
        if isinstance(atom, str):
            # 旧格式：直接用 string
            cat = "other"
            desc = atom
        else:
            cat = atom.get("category", "other")
            desc = atom.get("prompt_en", atom.get("id", "flower"))

        if cat not in categorized:
            categorized[cat] = []
        if desc not in categorized[cat]:
            categorized[cat].append(desc)

    # 按分类顺序拼接
    for cat in CATEGORY_ORDER:
        if cat in categorized:
            parts.extend(categorized[cat])

    # 追加未排序的分类
    for cat, descs in categorized.items():
        if cat not in CATEGORY_ORDER:
            parts.extend(descs)

    desc_str = ", ".join(parts[:15]) if parts else "a flower"
    qualifier = RARITY_QUALIFIERS.get(rarity, "beautiful")

    return (
        f"anime style, botanical illustration, {qualifier} flower, "
        f"{desc_str}, "
        f"clean composition, centered, solo, "
        f"masterpiece, high quality, detailed petals, "
        f"simple white background"
    )


def build_stage_prompt(atoms, rarity: str, stage: str) -> str:
    """构建指定生长阶段的 prompt。"""
    base = build_prompt(atoms, rarity)
    modifier = STAGE_MODIFIERS.get(stage, "")
    return f"{base}, {modifier}" if modifier else base


def get_negative_prompt() -> str:
    return NEGATIVE_PROMPT
