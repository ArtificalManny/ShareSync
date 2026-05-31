from pathlib import Path
from datetime import datetime
import shutil
import struct
import zlib
import math
import re

root = Path(".")
public = root / "public"
icons = public / "icons"
index_path = root / "index.html"

if not index_path.exists():
    raise FileNotFoundError("Missing index.html. Run this from the frontend root.")

public.mkdir(exist_ok=True)
icons.mkdir(parents=True, exist_ok=True)

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

files_to_backup = [
    index_path,
    public / "favicon.ico",
    public / "favicon.svg",
    public / "icon-192.png",
    public / "apple-touch-icon.png",
    icons / "favicon-16x16.png",
    icons / "favicon-32x32.png",
    icons / "favicon-48x48.png",
    icons / "apple-touch-icon.png",
    icons / "openshare-favicon.svg",
    icons / "safari-pinned-tab.svg",
]

for f in files_to_backup:
    if f.exists():
        shutil.copy2(f, f.with_suffix(f.suffix + f".backup-tab-icon-v3-{stamp}"))

def write_png(path, size):
    scale = 4
    W = H = size * scale
    pixels = [(0, 0, 0, 0) for _ in range(W * H)]

    def blend_pixel(x, y, color):
        if x < 0 or y < 0 or x >= W or y >= H:
            return
        r, g, b, a = color
        idx = y * W + x
        br, bg, bb, ba = pixels[idx]
        af = a / 255
        bf = ba / 255
        out_a = af + bf * (1 - af)
        if out_a <= 0:
            pixels[idx] = (0, 0, 0, 0)
            return
        out_r = int((r * af + br * bf * (1 - af)) / out_a)
        out_g = int((g * af + bg * bf * (1 - af)) / out_a)
        out_b = int((b * af + bb * bf * (1 - af)) / out_a)
        pixels[idx] = (out_r, out_g, out_b, int(out_a * 255))

    def circle(cx, cy, radius, color):
        cx *= scale
        cy *= scale
        radius *= scale
        x0 = int(cx - radius - 1)
        x1 = int(cx + radius + 1)
        y0 = int(cy - radius - 1)
        y1 = int(cy + radius + 1)
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2:
                    blend_pixel(x, y, color)

    def stroke_points(points, width, colors):
        radius = width / 2
        for i, (x, y) in enumerate(points):
            t = i / max(1, len(points) - 1)
            c1, c2 = colors
            color = tuple(int(c1[j] + (c2[j] - c1[j]) * t) for j in range(4))
            circle(x, y, radius, color)

    # Soft plate
    circle(size / 2, size / 2, size * 0.43, (245, 243, 255, 235))
    circle(size * 0.62, size * 0.38, size * 0.22, (236, 254, 255, 115))

    # Main open orbit
    cx = cy = size / 2
    r = size * 0.315
    start = math.radians(-48)
    end = math.radians(238)
    points = []
    steps = 260
    for i in range(steps):
        a = start + (end - start) * i / (steps - 1)
        points.append((cx + math.cos(a) * r, cy + math.sin(a) * r))

    stroke_points(
        points,
        size * 0.105,
        ((168, 85, 247, 255), (45, 212, 191, 255))
    )

    # Inner shared-flow wave
    wave = []
    x1 = size * 0.31
    x2 = size * 0.69
    for i in range(120):
        t = i / 119
        x = x1 + (x2 - x1) * t
        y = cy + math.sin((t * 2 - 0.15) * math.pi * 2) * (size * 0.055)
        wave.append((x, y))

    stroke_points(
        wave,
        size * 0.055,
        ((124, 58, 237, 255), (45, 212, 191, 255))
    )

    # Live dot
    dot_x, dot_y = points[0]
    circle(dot_x, dot_y, size * 0.065, (45, 212, 191, 255))

    # Downsample
    final = []
    for y in range(size):
        for x in range(size):
            samples = []
            for yy in range(scale):
                for xx in range(scale):
                    samples.append(pixels[(y * scale + yy) * W + (x * scale + xx)])
            final.append(tuple(sum(p[i] for p in samples) // len(samples) for i in range(4)))

    raw = b""
    for y in range(size):
        raw += b"\x00"
        for x in range(size):
            raw += bytes(final[y * size + x])

    def chunk(kind, data):
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )

    path.write_bytes(png)
    return png

favicon_svg = r'''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <defs>
    <radialGradient id="plate" cx="35%" cy="25%" r="75%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.98"/>
      <stop offset="48%" stop-color="#F5F3FF" stop-opacity="0.92"/>
      <stop offset="78%" stop-color="#ECFEFF" stop-opacity="0.76"/>
      <stop offset="100%" stop-color="#EEF2FF" stop-opacity="0.62"/>
    </radialGradient>
    <linearGradient id="orbit" x1="12" y1="10" x2="52" y2="54">
      <stop offset="0%" stop-color="#A855F7"/>
      <stop offset="48%" stop-color="#7C3AED"/>
      <stop offset="76%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#2DD4BF"/>
    </linearGradient>
    <linearGradient id="signal" x1="18" y1="34" x2="46" y2="30">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="55%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#2DD4BF"/>
    </linearGradient>
  </defs>

  <circle cx="32" cy="32" r="28" fill="url(#plate)"/>
  <path d="M47.2 13.8 A24 24 0 1 1 21 12"
        stroke="url(#orbit)"
        stroke-width="7"
        stroke-linecap="round"
        stroke-linejoin="round"/>
  <path d="M20 34 C25 26.5 29.4 26.5 32 32 C34.6 37.5 39 37.5 44 30"
        stroke="url(#signal)"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"/>
  <circle cx="47.2" cy="13.8" r="4.2" fill="#2DD4BF"/>
</svg>
'''

mask_svg = r'''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M47.2 13.8 A24 24 0 1 1 21 12"
        stroke="black"
        stroke-width="7"
        stroke-linecap="round"
        stroke-linejoin="round"/>
  <path d="M20 34 C25 26.5 29.4 26.5 32 32 C34.6 37.5 39 37.5 44 30"
        stroke="black"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"/>
  <circle cx="47.2" cy="13.8" r="4.2" fill="black"/>
</svg>
'''

(public / "favicon.svg").write_text(favicon_svg)
(icons / "openshare-favicon.svg").write_text(favicon_svg)
(icons / "safari-pinned-tab.svg").write_text(mask_svg)

png16 = write_png(icons / "favicon-16x16.png", 16)
png32 = write_png(icons / "favicon-32x32.png", 32)
png48 = write_png(icons / "favicon-48x48.png", 48)
write_png(icons / "apple-touch-icon.png", 180)
write_png(public / "apple-touch-icon.png", 180)
write_png(public / "icon-192.png", 192)

# Build favicon.ico with PNG entries.
ico_entries = [(16, png16), (32, png32), (48, png48)]
header = struct.pack("<HHH", 0, 1, len(ico_entries))
offset = 6 + len(ico_entries) * 16
directory = b""
payload = b""

for size, data in ico_entries:
    width_byte = size if size < 256 else 0
    height_byte = size if size < 256 else 0
    directory += struct.pack(
        "<BBBBHHII",
        width_byte,
        height_byte,
        0,
        0,
        1,
        32,
        len(data),
        offset
    )
    payload += data
    offset += len(data)

(public / "favicon.ico").write_bytes(header + directory + payload)

html = index_path.read_text()

icons_block = '''    <!-- Icons -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=openshare-tab-v3" />
    <link rel="icon" type="image/svg+xml" href="/icons/openshare-favicon.svg?v=openshare-tab-v3" />
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png?v=openshare-tab-v3" />
    <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png?v=openshare-tab-v3" />
    <link rel="shortcut icon" href="/favicon.ico?v=openshare-tab-v3" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png?v=openshare-tab-v3" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=openshare-tab-v3" />
    <link rel="mask-icon" href="/icons/safari-pinned-tab.svg?v=openshare-tab-v3" color="#7c3aed" />'''

pattern = re.compile(
    r'    <!-- Icons -->\n.*?(?=\n\n    <!-- iOS Splash Screens)',
    re.DOTALL
)

if not pattern.search(html):
    raise RuntimeError("Could not find Icons block in index.html.")

html = pattern.sub(icons_block, html)
html = html.replace(
    '<meta name="apple-mobile-web-app-title" content="ShareSync" />',
    '<meta name="apple-mobile-web-app-title" content="OpenShare" />'
)

index_path.write_text(html)

print("Forced OpenShare tab icons installed successfully.")
print("Updated:")
print("- index.html")
print("- public/favicon.svg")
print("- public/favicon.ico")
print("- public/icons/openshare-favicon.svg")
print("- public/icons/favicon-16x16.png")
print("- public/icons/favicon-32x32.png")
print("- public/icons/favicon-48x48.png")
print("- public/icons/apple-touch-icon.png")
print("- public/apple-touch-icon.png")
print("- public/icon-192.png")
print("- public/icons/safari-pinned-tab.svg")
print("")
print(f"Backups include timestamp: {stamp}")
