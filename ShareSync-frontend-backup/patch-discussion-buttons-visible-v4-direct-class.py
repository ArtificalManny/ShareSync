from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/views/ThreadsView.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-discussion-buttons-visible-v4-direct-class-{timestamp}"
)
backup_path.write_text(original)

lines = original.splitlines()
updated_lines = []

primary_count = 0
modal_count = 0

primary_header_class = (
    'discussion-primary-button discussion-force-purple inline-flex items-center gap-2 '
    'rounded-2xl border border-violet-300 !bg-violet-700 px-5 py-2.5 text-sm '
    'font-black !text-white !opacity-100 shadow-[0_18px_40px_rgba(124,58,237,0.42)] '
    'ring-1 ring-white/40 transition-all hover:-translate-y-0.5 hover:!bg-violet-800 '
    'hover:shadow-[0_22px_50px_rgba(124,58,237,0.52)] disabled:!bg-violet-600 '
    'disabled:!text-white disabled:!opacity-95 disabled:cursor-not-allowed'
)

primary_empty_class = (
    'discussion-primary-button discussion-force-purple mt-6 inline-flex items-center gap-2 '
    'rounded-2xl border border-violet-300 !bg-violet-700 px-5 py-3 text-sm '
    'font-black !text-white !opacity-100 shadow-[0_18px_40px_rgba(124,58,237,0.42)] '
    'ring-1 ring-white/40 transition-all hover:-translate-y-0.5 hover:!bg-violet-800 '
    'hover:shadow-[0_22px_50px_rgba(124,58,237,0.52)] disabled:!bg-violet-600 '
    'disabled:!text-white disabled:!opacity-95 disabled:cursor-not-allowed'
)

modal_create_class = (
    'discussion-modal-create-button discussion-force-purple flex-1 rounded-xl border '
    'border-violet-300 !bg-violet-700 px-5 py-3 text-sm font-black !text-white '
    '!opacity-100 shadow-[0_18px_40px_rgba(124,58,237,0.42)] ring-1 ring-white/40 '
    'transition-all hover:-translate-y-0.5 hover:!bg-violet-800 '
    'hover:shadow-[0_22px_50px_rgba(124,58,237,0.52)] disabled:!bg-violet-600 '
    'disabled:!text-white disabled:!opacity-95 disabled:cursor-not-allowed'
)

for line in lines:
    if 'className="' in line and 'discussion-primary-button' in line:
        indent = line[: len(line) - len(line.lstrip())]

        if "mt-6" in line:
            updated_lines.append(f'{indent}className="{primary_empty_class}"')
        else:
            updated_lines.append(f'{indent}className="{primary_header_class}"')

        primary_count += 1
        continue

    if 'className="' in line and 'discussion-modal-create-button' in line:
        indent = line[: len(line) - len(line.lstrip())]
        updated_lines.append(f'{indent}className="{modal_create_class}"')
        modal_count += 1
        continue

    updated_lines.append(line)

updated = "\n".join(updated_lines) + ("\n" if original.endswith("\n") else "")

if primary_count == 0:
    FILE_PATH.write_text(original)
    raise RuntimeError("Could not find any discussion-primary-button class lines. Original restored.")

if modal_count == 0:
    FILE_PATH.write_text(original)
    raise RuntimeError("Could not find discussion-modal-create-button class line. Original restored.")

unsafe_patterns = [
    "onClick={() =",
    "onClick={()= className=",
    "className==",
]

for bad in unsafe_patterns:
    if bad in updated:
        FILE_PATH.write_text(original)
        raise RuntimeError(
            f"Unsafe JSX corruption pattern detected: {bad}. Original restored. Backup saved at {backup_path}"
        )

FILE_PATH.write_text(updated)

print("Discussion button visibility v4 direct class patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print(f"- discussion-primary-button class lines updated: {primary_count}")
print(f"- discussion-modal-create-button class lines updated: {modal_count}")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No thread fetching, filtering, messaging, modal state, or create-discussion logic was changed.")
