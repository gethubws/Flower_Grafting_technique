"""Image post-processing utilities

After SD generates flower images, we process them:
1. Remove dark/near-black background → alpha transparency
2. Crop to content bounds
3. Resize/optimize for display on garden pots
"""
from io import BytesIO
from PIL import Image, ImageFilter


def remove_black_background(
    image_bytes: bytes,
    threshold: int = 40,
    feather_radius: int = 3,
) -> bytes:
    """
    Convert near-black/dark pixels to transparent.

    SD is prompted with 'black background' — this removes that black
    and creates a clean RGBA flower image for overlay on the garden.

    Args:
        image_bytes: PNG image bytes
        threshold: pixels darker than this (0-255) become transparent
        feather_radius: Alpha blur radius for smooth edges
    """
    img = Image.open(BytesIO(image_bytes)).convert("RGBA")
    pixels = img.load()
    w, h = img.size

    # Build alpha mask: pixel where R,G,B are all < threshold → transparent
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r < threshold and g < threshold and b < threshold:
                pixels[x, y] = (r, g, b, 0)

    # Feather the alpha channel for smooth edges
    if feather_radius > 0:
        r, g, b, alpha = img.split()
        alpha = alpha.filter(ImageFilter.GaussianBlur(feather_radius))
        img = Image.merge("RGBA", (r, g, b, alpha))

    out = BytesIO()
    img.save(out, format="PNG")
    return out.getvalue()


def crop_to_content(
    image_bytes: bytes,
    padding: int = 4,
    min_alpha: int = 10,
) -> bytes:
    """
    Crop image to the bounding box of visible content (non-transparent area).
    """
    img = Image.open(BytesIO(image_bytes)).convert("RGBA")
    alpha = img.split()[-1]

    # Find non-transparent bounds
    bbox = alpha.getbbox()
    if bbox is None:
        return image_bytes

    # Add padding
    bbox = (
        max(0, bbox[0] - padding),
        max(0, bbox[1] - padding),
        min(img.width, bbox[2] + padding),
        min(img.height, bbox[3] + padding),
    )

    cropped = img.crop(bbox)
    out = BytesIO()
    cropped.save(out, format="PNG")
    return out.getvalue()


def process_flower_image(
    image_bytes: bytes,
    remove_bg: bool = True,
    crop: bool = True,
    bg_threshold: int = 40,
) -> bytes:
    """
    Full processing pipeline for a flower image from SD:
    1. Remove dark background → transparent
    2. Crop to content bounds
    """
    if remove_bg:
        image_bytes = remove_black_background(image_bytes, threshold=bg_threshold)

    if crop:
        image_bytes = crop_to_content(image_bytes, padding=4)

    return image_bytes


def optimize_for_web(
    image_bytes: bytes,
    max_width: int = 256,
    max_height: int = 384,
) -> bytes:
    """Resize image to fit within max dimensions while preserving aspect ratio."""
    img = Image.open(BytesIO(image_bytes))
    img.thumbnail((max_width, max_height), Image.LANCZOS)

    out = BytesIO()
    # Preserve RGBA if present
    fmt = img.format or "PNG"
    save_kwargs = {}
    if img.mode == "RGBA":
        fmt = "PNG"
    elif fmt == "JPEG":
        save_kwargs["quality"] = 85
        save_kwargs["optimize"] = True

    img.save(out, format=fmt, **save_kwargs)
    return out.getvalue()
