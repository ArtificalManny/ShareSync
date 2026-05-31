from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/components/views/ThreadsView.jsx")

if not path.exists():
    raise RuntimeError(f"Missing file: {path}")

original = path.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path(f"{path}.backup-before-team-room-labels-{timestamp}")
shutil.copy2(path, backup)

replacements = [
    # Main visible section language
    ("Discussion", "Team Room"),
    ("discussion", "team room"),

    # Button/modal language refinements
    ("New Team Room", "New Thread"),
    ("Create Team Room", "Create Thread"),
    ("Start New Team Room", "Start New Thread"),
    ("Start thread", "Start thread"),

    # Placeholder / empty states
    ("Search team rooms...", "Search team threads..."),
    ("No team rooms found", "No team threads found"),
    ("Select a team room", "Select a thread"),

    # Keep these phrases cleaner after broad replacement
    ("Team Room Title", "Thread Title"),
    ("Add to this team room...", "Add to this thread..."),
    ("No team room yet", "No thread activity yet"),
    ("Team Room created", "Thread created"),
    ("project team room", "project thread"),
    ("side conversations", "side conversations"),
]

updated = original

for old, new in replacements:
    updated = updated.replace(old, new)

# Specific polished copy after broad replacement.
updated = updated.replace(
    "Centralize decisions, questions, and project context so the team can move without scattered side conversations.",
    "Centralize decisions, questions, and project context so the team can move from one shared room."
)

updated = updated.replace(
    "Choose a project thread from the left, or start a new team room to capture decisions, blockers, and questions in one place.",
    "Choose a project thread from the left, or start a new thread to capture decisions, blockers, and questions in one place."
)

updated = updated.replace(
    "Send a message to get this team room moving",
    "Send a message to get this thread moving"
)

# Safety checks: preserve component/API names and real thread logic.
required_markers = [
    "export default function ThreadsView",
    "getProjectThreads",
    "createThread",
    "getThreadMessages",
    "postThreadMessage",
    "CreateThreadModal",
    "ThreadListItem",
    "ConversationPanel",
]

for marker in required_markers:
    if marker not in updated:
        path.write_text(original)
        raise RuntimeError(
            f"Safety check failed: missing {marker}. Original restored. Backup kept at: {backup}"
        )

# Avoid accidental component/API renames.
for forbidden in [
    "TeamRoomView",
    "getProjectTeamRooms",
    "createTeamRoom",
    "getTeamRoomMessages",
    "postTeamRoomMessage",
]:
    if forbidden in updated:
        path.write_text(original)
        raise RuntimeError(
            f"Unsafe rename detected: {forbidden}. Original restored. Backup kept at: {backup}"
        )

if updated == original:
    raise RuntimeError(f"No changes made. Backup kept at: {backup}")

path.write_text(updated)

print("Team Room visible labels applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed user-facing language only:")
print("- Discussion heading -> Team Room")
print("- New Discussion -> New Thread")
print("- Discussion Title -> Thread Title")
print("- Search discussions -> Search team threads")
print("- Empty/select states now say thread/team room")
print("")
print("Kept intact:")
print("- ThreadsView component name")
print("- thread API helpers")
print("- create/read/send logic")
print("- member picker logic")
print("- Files and Announcements sections")
