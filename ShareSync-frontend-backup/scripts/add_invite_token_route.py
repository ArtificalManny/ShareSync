from pathlib import Path

path = Path("src/App.jsx")

if not path.exists():
    raise SystemExit(f"Missing file: {path}")

text = path.read_text()

if 'path="/invite/:token"' in text:
    print("Invite token route already exists. No changes made.")
    raise SystemExit(0)

old = '              <Route path="/invite/accept" element={<AcceptInvite />} />'

new = '''              <Route path="/invite/:token" element={<AcceptInvite />} />
              <Route path="/invite/accept" element={<AcceptInvite />} />'''

if old not in text:
    raise SystemExit("Could not find existing /invite/accept route in src/App.jsx.")

text = text.replace(old, new, 1)

path.write_text(text)

print("Added /invite/:token route above /invite/accept in src/App.jsx")
