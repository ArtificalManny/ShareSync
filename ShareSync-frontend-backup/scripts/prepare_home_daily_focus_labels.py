from pathlib import Path

path = Path("src/pages/Home.jsx")
text = path.read_text()

replacements = [
    (
        """      {/* ═══════════════════════════════════════════════════════════════════
          YOUR MOVES TODAY
      ═══════════════════════════════════════════════════════════════════ */}""",
        """      {/* ═══════════════════════════════════════════════════════════════════
          DAILY FOCUS ENGINE
          This is the primary "What should we work on today?" surface.
          Keep the recommendation/selection logic inside YourMovesToday for now.
      ═══════════════════════════════════════════════════════════════════ */}"""
    ),
    (
        'title="Recommended for Today"',
        'title="Suggested Projects & Missions"'
    ),
    (
        'onViewAll={() => console.log("View all moves")}',
        'onViewAll={() => console.log("View all daily focus moves")}'
    ),
]

for old, new in replacements:
    if old not in text:
        print(f"⚠️ Could not find expected text block, skipping:\\n{old[:120]}...")
        continue
    text = text.replace(old, new, 1)

path.write_text(text)

print("✅ Home.jsx prepared for Daily Focus terminology.")
print("✅ YourMovesToday remains the primary daily-focus mount point.")
print("✅ Lower missions section renamed to Suggested Projects & Missions.")
