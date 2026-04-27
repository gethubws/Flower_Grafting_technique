"""L3 Placeholder Image Generator

Phase 1: Generates a 512×768 RGBA image with:
- Transparent background
- A gradient pot (gray/brown rectangle)
- A flower crown (colored ellipse by rarity)
- A center circle (stamen)
"""
from io import BytesIO
from PIL import Image, ImageDraw

# Rarity → color mapping (ARGB hex strings)
RARITY_COLORS = {
    "N": "#808080",   # Gray
    "R": "#4488ff",   # Blue
    "SR": "#aa44ff",  # Purple
    "SSR": "#ffaa00",  # Gold
    "UR": "#ff3333",  # Red
}

# Stage → size factor
STAGE_SCALE = {
    "SEED": 0.3,
    "SEEDLING": 0.5,
    "GROWING": 0.8,
    "MATURE": 0.95,
    "BLOOMING": 1.0,
}


def generate_placeholder(
    rarity: str = "N",
    stage: str = "BLOOMING",
    width: int = 512,
    height: int = 768,
) -> bytes:
    """Generate an L3 placeholder flower image, return PNG bytes."""
    color = RARITY_COLORS.get(rarity, "#808080")
    scale = STAGE_SCALE.get(stage, 1.0)

    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = width // 2, height // 2

    # Pot (bottom)
    pot_w = int(120 * scale)
    pot_h = int(100 * scale)
    pot_top = cy + int(80 * scale)
    # Pot gradient: top light, bottom dark
    pot_rect = [(cx - pot_w // 2, pot_top), (cx + pot_w // 2, pot_top + pot_h)]
    draw.rectangle(pot_rect, fill="#8B6914", outline="#6B4F12", width=2)
    # Pot rim
    rim_rect = [(cx - pot_w // 2 - 4, pot_top), (cx + pot_w // 2 + 4, pot_top + 12)]
    draw.rectangle(rim_rect, fill="#A0782C", outline="#6B4F12", width=1)

    # Stem (line from pot top to flower base)
    stem_top = pot_top - int(200 * scale)
    draw.line([(cx, pot_top), (cx, stem_top)], fill="#4A7C3F", width=int(6 * scale))

    # Flower crown (ellipse)
    crown_w = int(100 * scale)
    crown_h = int(70 * scale)
    crown_bbox = [
        (cx - crown_w // 2, stem_top - crown_h // 2),
        (cx + crown_w // 2, stem_top + crown_h // 2),
    ]
    draw.ellipse(crown_bbox, fill=color, outline="#00000040", width=1)

    # Center stamen (small circle)
    stamen_r = int(15 * scale)
    draw.ellipse(
        [(cx - stamen_r, stem_top - stamen_r), (cx + stamen_r, stem_top + stamen_r)],
        fill="#FFD700",
        outline="#B8860B",
        width=1,
    )

    # Rarity badge (top-left)
    badge_size = 40
    draw.ellipse(
        [(10, 10), (10 + badge_size, 10 + badge_size)],
        fill=color,
        outline="#ffffff80",
        width=2,
    )
    draw.text((20, 18), rarity, fill="white")

    # Save to bytes
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
