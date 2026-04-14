from pathlib import Path

try:
    from PIL import Image
except ImportError:
    raise SystemExit("Pillow is not installed. Run: python3 -m pip install pillow")

root = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup/public")
src = root / "favicon-32x32.png"
dst = root / "favicon.ico"

if not src.exists():
    raise SystemExit(f"Missing source PNG: {src}")

img = Image.open(src).convert("RGBA")
img.save(dst, format="ICO", sizes=[(16, 16), (32, 32)])
print(f"Created {dst}")
