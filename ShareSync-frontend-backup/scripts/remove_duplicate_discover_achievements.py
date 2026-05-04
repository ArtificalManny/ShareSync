from pathlib import Path
from datetime import datetime
import re
import sys

TARGET = Path("src/pages/Discover.jsx")

def fail(message):
    print(f"[remove_duplicate_discover_achievements] ERROR: {message}")
    sys.exit(1)

def find_tag_end(text, start):
    end = text.find("/>", start)
    if end == -1:
        fail("could not find self-closing /> for an Achievements component")
    if end - start > 800:
        fail("Achievements tag looks too large; refusing to patch automatically")
    return end + 2

def remove_tag_at(text, start):
    end = find_tag_end(text, start)

    line_start = text.rfind("\n", 0, start) + 1
    line_end = text.find("\n", end)

    if line_end == -1:
        line_end = len(text)
    else:
        line_end += 1

    removed = text[line_start:line_end]

    if "<Achievements" not in removed:
        fail("internal error: selected block does not contain Achievements")

    return text[:line_start] + text[line_end:], removed

def main():
    print("[remove_duplicate_discover_achievements] starting")

    if not TARGET.exists():
        fail(f"missing file: {TARGET}")

    text = TARGET.read_text()
    original = text

    matches = list(re.finditer(r"<Achievements\b", text))

    if len(matches) <= 1:
        print(f"[remove_duplicate_discover_achievements] found {len(matches)} Achievements render(s); no duplicate to remove")
        return

    print(f"[remove_duplicate_discover_achievements] found {len(matches)} Achievements renders")

    # Prefer keeping the Achievements component closest after the Network Pulse section.
    # That is the cleaner sidebar/right-rail placement shown in Discover.
    scored = []
    for idx, match in enumerate(matches):
        pos = match.start()
        previous_network_pulse = text.rfind("Network Pulse", 0, pos)

        if previous_network_pulse == -1:
            distance = 10**9
        else:
            distance = pos - previous_network_pulse

        scored.append((distance, idx, pos))

    keep_distance, keep_idx, keep_pos = min(scored, key=lambda item: item[0])

    if keep_distance >= 10**9:
        # Safe fallback: keep the first render and remove later duplicates.
        keep_idx = 0
        keep_pos = matches[0].start()
        print("[warn] Network Pulse marker not found before Achievements; keeping first render as safest fallback")
    else:
        print(f"[keep] keeping Achievements render #{keep_idx + 1}, closest after Network Pulse")

    remove_positions = [
        match.start()
        for idx, match in enumerate(matches)
        if idx != keep_idx
    ]

    removed_blocks = []

    # Remove from bottom to top so character positions stay valid.
    for pos in sorted(remove_positions, reverse=True):
        text, removed = remove_tag_at(text, pos)
        removed_blocks.append(removed.strip())
        print("[removed] duplicate Achievements render")

    backup = TARGET.with_suffix(
        TARGET.suffix + f".bak.before-remove-duplicate-achievements-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    backup.write_text(original)
    TARGET.write_text(text)

    updated_count = len(re.findall(r"<Achievements\b", TARGET.read_text()))

    if updated_count != 1:
        fail(f"expected exactly 1 Achievements render after patch, found {updated_count}")

    print(f"[remove_duplicate_discover_achievements] backup created: {backup}")
    print("[remove_duplicate_discover_achievements] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "Achievements|Your Achievements|Network Pulse" src/pages/Discover.jsx -C 10')
    print("  git diff -- src/pages/Discover.jsx")

if __name__ == "__main__":
    main()
