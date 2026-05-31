from pathlib import Path
from datetime import datetime

ROADMAP_PANEL = Path("src/components/roadmap/RoadmapPanel.jsx")
ADD_MODAL = Path("src/components/roadmap/AddMilestoneModal.jsx")

for path in [ROADMAP_PANEL, ADD_MODAL]:
    if not path.exists():
        raise FileNotFoundError(f"Could not find {path}")

timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

panel_original = ROADMAP_PANEL.read_text()
modal_original = ADD_MODAL.read_text()

panel_backup = ROADMAP_PANEL.with_suffix(
    ROADMAP_PANEL.suffix + f".backup-roadmap-buttons-visible-v3-inline-{timestamp}"
)
modal_backup = ADD_MODAL.with_suffix(
    ADD_MODAL.suffix + f".backup-roadmap-buttons-visible-v3-inline-{timestamp}"
)

panel_backup.write_text(panel_original)
modal_backup.write_text(modal_original)


def find_opening_tag_end(text, start_index):
    quote = None
    brace_depth = 0
    i = start_index

    while i < len(text):
        ch = text[i]
        prev = text[i - 1] if i > 0 else ""

        if quote:
            if ch == quote and prev != "\\":
                quote = None
        else:
            if ch in ("'", '"', "`"):
                quote = ch
            elif ch == "{":
                brace_depth += 1
            elif ch == "}":
                brace_depth = max(0, brace_depth - 1)
            elif ch == ">" and brace_depth == 0:
                return i

        i += 1

    raise RuntimeError("Could not find the end of the JSX opening tag.")


def add_class_to_tag(tag, class_name):
    if class_name in tag:
        return tag

    if 'className="' in tag:
        return tag.replace('className="', f'className="{class_name} ', 1)

    if "className='" in tag:
        return tag.replace("className='", f"className='{class_name} ", 1)

    if "className={`" in tag:
        return tag.replace("className={`", f"className={{`{class_name} ", 1)

    if "className={" in tag:
        raise RuntimeError("Dynamic className found. Refusing to patch automatically.")

    return tag[:-1] + f' className="{class_name}">'


def add_inline_purple_style_to_tag(tag):
    if "roadmapInlinePurpleButtonStyle" in tag:
        return tag

    if "style=" in tag:
        raise RuntimeError(
            "This button already has a style prop. Refusing to add a second style prop."
        )

    return tag[:-1] + """
                style={{
                  background:
                    "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)",
                  color: "#ffffff",
                  opacity: 1,
                  border: "1px solid rgba(221, 214, 254, 0.92)",
                  boxShadow:
                    "0 16px 36px rgba(109, 40, 217, 0.40), inset 0 1px 0 rgba(255, 255, 255, 0.30)",
                  textShadow: "0 1px 8px rgba(0, 0, 0, 0.24)",
                }}
              >"""


def patch_button_before_text(text, button_text, class_name, label, use_last=False):
    marker_index = text.rfind(button_text) if use_last else text.find(button_text)

    if marker_index == -1:
        raise RuntimeError(f"Could not find text marker for {label}: {button_text}")

    button_start = text.rfind("<button", 0, marker_index)

    if button_start == -1:
        raise RuntimeError(f"Could not find opening <button> for {label}")

    button_end = find_opening_tag_end(text, button_start)
    tag = text[button_start:button_end + 1]

    tag = add_class_to_tag(tag, class_name)
    tag = add_inline_purple_style_to_tag(tag)

    return text[:button_start] + tag + text[button_end + 1:]


panel_style = r'''        <style className="roadmap-button-inline-visibility-v3-style">
          {`
            .roadmap-hard-purple-button,
            .roadmap-hard-purple-button span,
            .roadmap-hard-purple-button svg,
            .roadmap-hard-purple-button * {
              color: #ffffff !important;
              stroke: #ffffff !important;
              opacity: 1 !important;
            }

            .roadmap-hard-purple-button:disabled {
              opacity: 0.92 !important;
              cursor: not-allowed !important;
            }

            .roadmap-hard-purple-button:hover:not(:disabled) {
              filter: brightness(1.04) saturate(1.08);
              transform: translateY(-1px);
            }
          `}
        </style>'''

modal_style = r'''      <style className="roadmap-create-button-inline-visibility-v3-style">
        {`
          .roadmap-create-hard-purple-button,
          .roadmap-create-hard-purple-button span,
          .roadmap-create-hard-purple-button svg,
          .roadmap-create-hard-purple-button * {
            color: #ffffff !important;
            stroke: #ffffff !important;
            opacity: 1 !important;
          }

          .roadmap-create-hard-purple-button:disabled {
            opacity: 0.92 !important;
            cursor: not-allowed !important;
          }

          .roadmap-create-hard-purple-button:hover:not(:disabled) {
            filter: brightness(1.04) saturate(1.08);
            transform: translateY(-1px);
          }
        `}
      </style>'''


def insert_style_after_opening_tag(text, tag_start, style_block, marker):
    if marker in text:
        return text, False

    tag_end = find_opening_tag_end(text, tag_start)
    return text[:tag_end + 1] + "\n" + style_block + text[tag_end + 1:], True


# Patch RoadmapPanel Add Milestone button
panel_updated = panel_original

roadmap_anchor = "Track milestones, deadlines, and delivery progress as tasks move across the project."
roadmap_anchor_index = panel_updated.find(roadmap_anchor)

if roadmap_anchor_index == -1:
    raise RuntimeError("Could not find Roadmap header anchor text.")

section_start = panel_updated.rfind("<section", 0, roadmap_anchor_index)

if section_start == -1:
    raise RuntimeError("Could not find RoadmapPanel root <section>.")

panel_updated, panel_style_added = insert_style_after_opening_tag(
    panel_updated,
    section_start,
    panel_style,
    "roadmap-button-inline-visibility-v3-style",
)

panel_updated = patch_button_before_text(
    panel_updated,
    "Add Milestone",
    "roadmap-hard-purple-button",
    "RoadmapPanel Add Milestone button",
    use_last=False,
)


# Patch AddMilestoneModal Create Milestone button
modal_updated = modal_original

return_index = modal_updated.find("return (")

if return_index == -1:
    raise RuntimeError("Could not find return block in AddMilestoneModal.jsx.")

modal_root_start = modal_updated.find("<div", return_index)

if modal_root_start == -1:
    raise RuntimeError("Could not find AddMilestoneModal root <div>.")

modal_updated, modal_style_added = insert_style_after_opening_tag(
    modal_updated,
    modal_root_start,
    modal_style,
    "roadmap-create-button-inline-visibility-v3-style",
)

modal_updated = patch_button_before_text(
    modal_updated,
    "Create Milestone",
    "roadmap-create-hard-purple-button",
    "AddMilestoneModal Create Milestone button",
    use_last=True,
)

# Safety check for the real old corruption pattern only.
real_bad_patterns = [
    'onClick={() = className=',
    'onClick={()= className=',
    'className="roadmap-add-milestone-button"> onAddMilestone',
    'className="roadmap-force-visible-button"> onAddMilestone',
]

for bad in real_bad_patterns:
    if bad in panel_updated or bad in modal_updated:
        raise RuntimeError(
            f"Unsafe JSX corruption pattern still present: {bad}. No changes were written."
        )

ROADMAP_PANEL.write_text(panel_updated)
ADD_MODAL.write_text(modal_updated)

print("Roadmap inline button visibility v3 patch applied successfully.")
print(f"Updated file: {ROADMAP_PANEL}")
print(f"Backup file:  {panel_backup}")
print(f"Updated file: {ADD_MODAL}")
print(f"Backup file:  {modal_backup}")
print("")
print("Changed only:")
print("- Add Milestone button inline visual styling")
print("- Create Milestone button inline visual styling")
print("- Scoped child text/icon color reinforcement")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No milestone creation, editing, deletion, filtering, sorting, or refresh logic was changed.")
