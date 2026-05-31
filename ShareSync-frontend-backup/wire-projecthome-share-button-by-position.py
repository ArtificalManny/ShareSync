from pathlib import Path
from datetime import datetime
import re

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise RuntimeError(f"Could not find {path}")

original = path.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_name(path.name + f".backup-before-share-button-position-{timestamp}")
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

def find_button_around(text, index):
    start = text.rfind("<button", 0, index)
    end = text.find("</button>", index)

    if start == -1 or end == -1:
        return None

    return start, end + len("</button>")

def find_next_button_after(text, index):
    start = text.find("<button", index)
    if start == -1:
        return None

    end = text.find("</button>", start)
    if end == -1:
        return None

    return start, end + len("</button>")

def prop_span(opening_tag, prop_name):
    match = re.search(rf"\s{re.escape(prop_name)}\s*=", opening_tag)
    if not match:
        return None

    start = match.start()
    value_start = opening_tag.find("=", match.start()) + 1

    while value_start < len(opening_tag) and opening_tag[value_start].isspace():
        value_start += 1

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
                    return start, i + 1

        return None

    if first in ("'", '"'):
        quote = first
        for i in range(value_start + 1, len(opening_tag)):
            if opening_tag[i] == quote and opening_tag[i - 1] != "\\":
                return start, i + 1
        return None

    end = value_start
    while end < len(opening_tag) and not opening_tag[end].isspace() and opening_tag[end] != ">":
        end += 1

    return start, end

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

# 1. Locate the Members button.
members_match = re.search(r">\s*Members\s*<|>\s*Members\s*$|Members", original)

if not members_match:
    fail(
        "Could not find the Members text in ProjectHome.jsx.\n"
        "Run this and paste the output:\n"
        "grep -n -B 20 -A 40 \"Members\" src/pages/ProjectHome.jsx"
    )

members_button = find_button_around(original, members_match.start())

if not members_button:
    fail(
        "Found Members text, but could not find the surrounding button.\n"
        "Run this and paste the output:\n"
        "grep -n -B 20 -A 40 \"Members\" src/pages/ProjectHome.jsx"
    )

members_open_end = find_open_tag_end(original, members_button[0])

if members_open_end == -1 or members_open_end > members_button[1]:
    fail("Could not safely read the Members button opening tag.")

members_opening = original[members_button[0]:members_open_end + 1]
members_onclick = get_prop(members_opening, "onClick")

if not members_onclick:
    fail(
        "The Members button was found, but it does not have an onClick handler.\n"
        "The invite modal may be opened from a wrapper/component instead.\n"
        "Run this and paste the output:\n"
        "grep -n -B 25 -A 60 \"Members\" src/pages/ProjectHome.jsx"
    )

# 2. Locate the very next button after Members.
next_button = find_next_button_after(original, members_button[1])

if not next_button:
    fail(
        "Could not find the next button after Members.\n"
        "Run this and paste the output:\n"
        "grep -n -B 25 -A 80 \"Members\" src/pages/ProjectHome.jsx"
    )

next_open_end = find_open_tag_end(original, next_button[0])

if next_open_end == -1 or next_open_end > next_button[1]:
    fail("Could not safely read the next button opening tag.")

next_button_html = original[next_button[0]:next_button[1]]

# Safety check: the next button should look icon-only, not a big labeled button.
if "Members" in next_button_html:
    fail("Safety check failed: the next button still appears to be the Members button.")

next_opening = original[next_button[0]:next_open_end + 1]

new_opening = next_opening
new_opening = set_prop(new_opening, "type", 'type="button"')
new_opening = set_prop(new_opening, "onClick", members_onclick)
new_opening = set_prop(new_opening, "aria-label", 'aria-label="Share invite link"')
new_opening = set_prop(new_opening, "title", 'title="Share invite link"')

updated = original[:next_button[0]] + new_opening + original[next_open_end + 1:]

if updated == original:
    fail("No changes were made. The share button may already be wired.")

path.write_text(updated)

print("ProjectHome share button wired by position.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
print("- Found the Members button")
print("- Reused its invite-modal onClick handler")
print("- Applied that same handler to the next button after Members")
print("- Added aria-label/title: Share invite link")
print("")
print("Next button preview:")
preview = re.sub(r'\\s+', ' ', next_button_html[:500]).strip()
print(preview)
print("")
print("Kept intact:")
print("- Files section")
print("- Announcements section")
print("- Existing invite modal")
print("- Backend/API logic")
print("- Routes")
