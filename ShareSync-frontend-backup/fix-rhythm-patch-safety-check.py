from pathlib import Path

PATCH_FILE = Path("patch-rhythm-schedule-visual-strike.py")

if not PATCH_FILE.exists():
    raise FileNotFoundError("Could not find patch-rhythm-schedule-visual-strike.py")

text = PATCH_FILE.read_text()

old = '"onClick={() ="'
new = '"onClick={() = className="'

if old not in text:
    print("The broad safety pattern was not found. No change needed.")
else:
    text = text.replace(old, new, 1)
    PATCH_FILE.write_text(text)
    print("Fixed the false-positive safety check in patch-rhythm-schedule-visual-strike.py")
    print("Changed:")
    print('- "onClick={() ="')
    print('+ "onClick={() = className="')
    print("")
    print("No app files were touched.")
