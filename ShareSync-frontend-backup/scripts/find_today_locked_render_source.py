from pathlib import Path
import re

ROOT = Path("src")

KEYWORDS = [
    "moves you chose",
    "locked for today",
    "plan locked",
    "plan state",
    "accepted",
    "add your own move",
    "completion",
    "your 3 moves today",
    "today",
    "locked",
]

ICONS = [
    "Sparkles",
    "WandSparkles",
    "Stars",
    "ClipboardCheck",
    "ListChecks",
    "Target",
    "Zap",
    "CheckCircle",
    "CheckCircle2",
    "ShieldCheck",
    "CircleCheck",
]

def should_scan(path):
    if path.suffix not in [".jsx", ".tsx", ".js", ".ts"]:
        return False
    text = str(path).lower()
    if ".bak" in text or "node_modules" in text or "dist/" in text:
        return False
    return True

candidates = []

for path in ROOT.rglob("*"):
    if not should_scan(path):
        continue

    text = path.read_text(errors="ignore")
    lower = text.lower()

    score = 0
    matched_keywords = []
    matched_icons = []

    for keyword in KEYWORDS:
        if keyword in lower:
            score += 10
            matched_keywords.append(keyword)

    for icon in ICONS:
        if re.search(rf"\b{re.escape(icon)}\b", text):
            score += 3
            matched_icons.append(icon)

    if score >= 13:
        candidates.append((score, path, matched_keywords, matched_icons, text))

candidates.sort(reverse=True, key=lambda item: item[0])

if not candidates:
    print("❌ No likely source file found.")
    print("Run:")
    print("rg -n \"locked|accepted|completion|add your own move|moves you chose|Sparkles|Target|Zap\" src --glob '!**/*.bak*' -C 10")
    raise SystemExit(1)

for score, path, keywords, icons, text in candidates[:12]:
    print("=" * 100)
    print(f"FILE: {path}")
    print(f"SCORE: {score}")
    print(f"KEYWORDS: {keywords}")
    print(f"ICONS: {icons}")
    print("-" * 100)

    lines = text.splitlines()
    printed = False

    for i, line in enumerate(lines):
        hay = line.lower()
        if any(k in hay for k in keywords[:6]) or any(icon in line for icon in icons):
            start = max(0, i - 8)
            end = min(len(lines), i + 14)

            for n in range(start, end):
                print(f"{n + 1:04d}: {lines[n]}")
            print()
            printed = True
            break

    if not printed:
        print("(Matched file, but no compact snippet found.)")
