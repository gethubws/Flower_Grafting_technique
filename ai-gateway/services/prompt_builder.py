"""Prompt Builder — Phase 1 Stub

Future: Convert atoms to natural-language prompt for SD.
Phase 1: Direct passthrough.
"""


def build_prompt(atoms: list[str], rarity: str = "N") -> str:
    """Build SD prompt from atoms (Phase 1: simple passthrough)."""
    if not atoms:
        return "a beautiful flower, botanical illustration, clean white background"

    atom_str = ", ".join(atoms[:8])
    return (
        f"({atom_str}), a beautiful flower, botanical illustration, "
        f"clean white background, high quality"
    )
