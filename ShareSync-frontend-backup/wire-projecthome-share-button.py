from pathlib import Path
from datetime import datetime
import re

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise RuntimeError(f"Could not find {path}")

original = path.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_name(path.name + f".backup-before-share-button-{timestamp}")
backup.write_text(original)

def fail(message):
    path.write_text(original)
    raise RuntimeError(message + f"\nOriginal restored. Backup kept at: {backup}")

def find_open_tag_end(text, start):
    quote = None
    brace_depth = 0

    for i in range(start, len(text)):
        ch = text[i]
        prev = text[i - 1] if i > 0 else ""

        if quote:
            if ch == quote and prev != "\\":
                quote = None
            continue

        if ch in ("'", '"', "`"):
            quote = ch
        elif ch == "{":
            brace_depth += 1
        elif ch == "}":
            brace_depth = max(0, brace_depth - 1)
        elif ch == ">" and brace_depth == 0:
            return i

    return -1

def prop_span(opening_tag, prop_name):
    match = re.search(rf"\s{re.escape(prop_name)}\s*=", opening_tag)
    if not match:
        return None

    start = match.start()
    value_start = opening_tag.find("=", match.start()) + 1

    while value_start < len(opening_tag) and opening_tag[value_start].isspace():
        value_start += 1

    if value_start >= len(opening_tag):
        return None

    first = opening_tag[value_start]

    if first == "{":
        depth = 0
        quote = None

        for i in range(value_start, len(opening_tag)):
            ch = opening_tag[i]
            prev = opening_tag[i - 1] if i > 0 else ""

            if quote:
                if ch == quote and prev != "\\":
                    quote = None
                continue

            if ch in ("'", '"', "`"):
                quote = ch
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return (start, i + 1)

        return None

    if first in ("'", '"'):
        quote = first
        for i in range(value_start + 1, len(opening_tag)):
            if opening_tag[i] == quote and opening_tag[i - 1] != "\\":
                return (start, i + 1)
        return None

    end = value_start
    while end < len(opening_tag) and not opening_tag[end].isspace() and opening_tag[end] != ">":
        end += 1

    return (start, end)

def get_prop(opening_tag, prop_name):
    span = prop_span(opening_tag, prop_name)
    if not span:
        return None
    return opening_tag[span[0]:span[1]].strip()

def set_prop(opening_tag, prop_name, prop_text):
    span = prop_span(opening_tag, prop_name)

    if span:
        return opening_tag[:span[0]] + " " + prop_text + opening_tag[span[1]:]

    insert_at = len("<button")
    return opening_tag[:insert_at] + " " + prop_text + opening_tag[insert_at:]

def find_button_around(text, index):
    start = text.rfind("<button", 0, index)
    end = text.find("</button>", index)

    if start == -1 or end == -1:
        return None

    return (start, end + len("</button>"))

# 1. Find the existing Members button and steal its onClick action.
members_button = None
members_onclick = None

for match in re.finditer(r"\bMembers\b", original):
    found = find_button_around(original, match.start())
    if not found:
        continue

    button_html = original[found[0]:found[1]]

    if "Members" not in button_html:
        continue

    open_end = find_open_tag_end(original, found[0])
    if open_end == -1 or open_end > found[1]:
        continue

    opening_tag = original[found[0]:open_end + 1]
    onclick = get_prop(opening_tag, "onClick")

    if onclick:
        members_button = found
        members_onclick = onclick
        break

if not members_button or not members_onclick:
    fail(
        "Could not find the existing Members button with an onClick handler.\n"
        "Run this and paste the output:\n"
        "grep -n -B 10 -A 25 \"Members\" src/pages/ProjectHome.jsx"
    )

# 2. Find the share icon button immediately after Members.
search_start = members_button[1]
search_end = min(len(original), search_start + 4000)
window = original[search_start:search_end]

share_hits = []
for keyword in ("<Share2", "<Share ", "<ShareIcon", "<ShareNodes", "<ShareNetwork"):
    pos = window.find(keyword)
    if pos != -1:
        share_hits.append(search_start + pos)

if not share_hits:
    fail(
        "Could not find a Share icon button after the Members button.\n"
        "Run this and paste the output:\n"
        "grep -n -B 15 -A 35 \"Members\\|Share2\\|Share\" src/pages/ProjectHome.jsx"
    )

share_icon_index = min(share_hits)
share_button = find_button_around(original, share_icon_index)

if not share_button:
    fail("Found the Share icon, but could not locate the surrounding button.")

share_open_end = find_open_tag_end(original, share_button[0])
if share_open_end == -1 or share_open_end > share_button[1]:
    fail("Could not safely read the Share button opening tag.")

share_opening = original[share_button[0]:share_open_end + 1]

new_share_opening = share_opening
new_share_opening = set_prop(new_share_opening, "type", 'type="button"')
new_share_opening = set_prop(new_share_opening, "onClick", members_onclick)
new_share_opening = set_prop(new_share_opening, "aria-label", 'aria-label="Share invite link"')
new_share_opening = set_prop(new_share_opening, "title", 'title="Share invite link"')

updated = original[:share_button[0]] + new_share_opening + original[share_open_end + 1:]

if updated == original:
    fail("No changes were made. The Share button may already be wired correctly.")

path.write_text(updated)

print("ProjectHome share button wired successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
print("- The Share icon beside Members now opens the existing Invite Members modal")
print("- Added aria-label/title: Share invite link")
print("")
print("Kept intact:")
print("- Files section")
print("- Announcements section")
print("- Existing invite modal")
print("- Backend/API logic")
print("- Routes")
