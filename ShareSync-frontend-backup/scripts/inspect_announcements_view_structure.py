from pathlib import Path

path = Path("src/components/views/AnnouncementsView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/AnnouncementsView.jsx")

text = path.read_text()
lines = text.splitlines()

print(f"✅ Inspecting {path}")
print(f"Total lines: {len(lines)}")

keywords = [
    "export default",
    "function AnnouncementsView",
    "const AnnouncementsView",
    "Post Announcement",
    "Announcements",
    "Broadcast",
    "Post Update",
    "Broadcast Update",
    "announcement",
    "Announcement",
    "modal",
    "Modal",
    "image",
    "comment",
    "Comment",
    "like",
    "Like",
    "pinned",
    "Pinned",
    "pin",
    "Pin",
    "urgent",
    "Urgent",
    "warning",
    "Warning",
    "success",
    "Success",
    "info",
    "Info",
]

print("\n========== SYMBOL MATCHES ==========")

for keyword in keywords:
    matches = []
    for i, line in enumerate(lines, start=1):
        if keyword in line:
            matches.append((i, line))

    if matches:
        print(f"\n--- {keyword} ---")
        for i, line in matches[:25]:
            print(f"{i:04d}: {line}")

print("\n========== IMPORTS ==========")
for i, line in enumerate(lines[:120], start=1):
    if line.strip().startswith("import ") or line.strip().startswith("} from"):
        print(f"{i:04d}: {line}")

print("\n========== MAIN COMPONENT START ==========")
main_markers = [
    "export default",
    "function AnnouncementsView",
    "const AnnouncementsView",
]

for marker in main_markers:
    found = False
    for i, line in enumerate(lines, start=1):
        if marker in line:
            start = max(1, i - 15)
            end = min(len(lines), i + 90)
            for j in range(start, end + 1):
                print(f"{j:04d}: {lines[j-1]}")
            found = True
            break
    if found:
        break

print("\n========== LIKELY HEADER / HERO REGION ==========")
for i, line in enumerate(lines, start=1):
    if "Announcements" in line or "Broadcast" in line:
        start = max(1, i - 35)
        end = min(len(lines), i + 80)
        for j in range(start, end + 1):
            print(f"{j:04d}: {lines[j-1]}")
        break

print("\n========== LIKELY MODAL REGION ==========")
modal_found = False
for i, line in enumerate(lines, start=1):
    if "Post Announcement" in line or "Broadcast Update" in line or "Post Update" in line:
        start = max(1, i - 60)
        end = min(len(lines), i + 180)
        for j in range(start, end + 1):
            print(f"{j:04d}: {lines[j-1]}")
        modal_found = True
        break

if not modal_found:
    print("⚠️ Could not find obvious modal region.")

print("\n========== LIKELY CARD / FEED REGION ==========")
card_keywords = ["map(", ".map(", "announcement.", "item.", "post.", "Like", "Comment"]

for keyword in card_keywords:
    found = False
    for i, line in enumerate(lines, start=1):
        if keyword in line:
            start = max(1, i - 50)
            end = min(len(lines), i + 160)
            for j in range(start, end + 1):
                print(f"{j:04d}: {lines[j-1]}")
            found = True
            break
    if found:
        break

print("\n========== EXPORT / TAIL ==========")
for i in range(max(1, len(lines) - 120), len(lines) + 1):
    print(f"{i:04d}: {lines[i-1]}")

print("\n✅ Inspection complete. No files were changed.")
