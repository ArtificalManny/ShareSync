from pathlib import Path
import shutil
from datetime import datetime
import re

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise FileNotFoundError(f"Could not find {path}")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".backup-before-share-invite-member-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
shutil.copy2(path, backup)

changed = []

def fail(message):
    shutil.copy2(backup, path)
    raise RuntimeError(message + f"\nOriginal restored. Backup kept at: {backup}")

# 1. Import InviteMember
if 'InviteMember from "../components/members/InviteMember"' not in text:
    anchor = 'import ProjectAvatar from "../components/project/ProjectAvatar";'
    if anchor not in text:
        fail("Could not find ProjectAvatar import anchor.")
    text = text.replace(
        anchor,
        anchor + '\nimport InviteMember from "../components/members/InviteMember";',
        1
    )
    changed.append("Imported InviteMember")

# 2. Add ProjectHeader prop
signature_anchor = """  onMembersClick,
  onLifecycleAction,"""

if signature_anchor in text and "onShareInviteClick" not in text[text.find("function ProjectHeader"):text.find("function ProjectHeader") + 900]:
    text = text.replace(
        signature_anchor,
        """  onMembersClick,
  onShareInviteClick,
  onLifecycleAction,""",
        1
    )
    changed.append("Added onShareInviteClick to ProjectHeader props")

# 3. Wire Share2 button to onShareInviteClick
share_icon = '<Share2 className="w-4 h-4" />'
share_index = text.find(share_icon)

if share_index == -1:
    fail("Could not find Share2 icon.")

button_start = text.rfind("<button", 0, share_index)
button_open_end = text.find(">", button_start)

if button_start == -1 or button_open_end == -1:
    fail("Could not find Share2 button opening tag.")

old_open = text[button_start:button_open_end + 1]

class_match = re.search(r'className=(?:"[^"]*"|{`[\s\S]*?`})', old_open)
if not class_match:
    fail("Could not find className on Share2 button.")

class_attr = class_match.group(0)

new_open = f'''<button
            type="button"
            onClick={{onShareInviteClick}}
            aria-label="Share invite link"
            title="Share invite link"
            {class_attr}
          >'''

text = text[:button_start] + new_open + text[button_open_end + 1:]
changed.append("Share icon now opens InviteMember modal instead of MembersPanel")

# 4. Add InviteMember modal state
state_anchor = '  const [isMembersPanelOpen, setIsMembersPanelOpen] = useState(false);'

if state_anchor not in text:
    fail("Could not find isMembersPanelOpen state.")

if "isInviteMemberOpen" not in text:
    text = text.replace(
        state_anchor,
        state_anchor + '\n  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);',
        1
    )
    changed.append("Added isInviteMemberOpen state")

# 5. Add invite handler
handler_anchor = """  const handleSpectatorFollowToggle = useCallback(async () => {
    await toggleSpectatorFollow();
  }, [toggleSpectatorFollow]);"""

invite_handler = """  const handleInviteMember = useCallback(async ({ email, role }) => {
    if (!id) {
      throw new Error("Missing project ID");
    }

    const response = await fetch(`/api/projects/${id}/invites`, {
      method: "POST",
      headers: buildJsonHeaders(),
      body: JSON.stringify({ email, role }),
    });

    const payload = await readApiJson(response);

    if (!response.ok) {
      throw new Error(payload?.message || "Failed to send invitation");
    }

    await refreshSilently?.();

    return payload;
  }, [id, refreshSilently]);"""

if handler_anchor not in text:
    fail("Could not find handleSpectatorFollowToggle anchor.")

if "const handleInviteMember = useCallback" not in text:
    text = text.replace(
        handler_anchor,
        handler_anchor + "\n\n" + invite_handler,
        1
    )
    changed.append("Added handleInviteMember API handler")

# 6. Pass onShareInviteClick into ProjectHeader
project_header_prop_anchor = "        onMembersClick={() => setIsMembersPanelOpen(true)}"

if project_header_prop_anchor not in text:
    fail("Could not find ProjectHeader onMembersClick prop.")

if "onShareInviteClick={() => setIsInviteMemberOpen(true)}" not in text:
    text = text.replace(
        project_header_prop_anchor,
        project_header_prop_anchor + "\n        onShareInviteClick={() => setIsInviteMemberOpen(true)}",
        1
    )
    changed.append("Passed onShareInviteClick into ProjectHeader")

# 7. Render InviteMember modal separately from MembersPanel
members_panel_anchor = """      {isMembersPanelOpen && (
        <MembersPanel"""

invite_modal_block = """      {isInviteMemberOpen && (
        <InviteMember
          projectId={id}
          projectName={project?.name || "Project"}
          onInvite={handleInviteMember}
          onClose={() => setIsInviteMemberOpen(false)}
        />
      )}

"""

if members_panel_anchor not in text:
    fail("Could not find MembersPanel render block.")

if "<InviteMember" not in text[text.find("<GlobalPulseBar"):]:
    text = text.replace(
        members_panel_anchor,
        invite_modal_block + members_panel_anchor,
        1
    )
    changed.append("Rendered InviteMember modal")

path.write_text(text)

print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
for item in changed:
    print(f"- {item}")
print("")
print("Expected behavior:")
print("- Members button opens Project Members")
print("- Share icon opens Invite Members / Share Invite Link")
print("")
print("Kept intact:")
print("- MembersPanel")
print("- InviteMember.jsx")
print("- Files")
print("- Announcements")
print("- Existing routes")
