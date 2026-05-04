from pathlib import Path

path = Path("src/hooks/useSocket.ts")

if not path.exists():
    raise SystemExit(f"File not found: {path}")

text = path.read_text()

old_base = """function getSocketBaseUrl() {
  const socketUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  return (socketUrl || apiUrl || window.location.origin).replace(/\\/+$/, "");
}
"""

new_base = """function getSocketBaseUrl() {
  const socketUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

  const raw = socketUrl || apiUrl || window.location.origin;

  // If someone only sets VITE_API_URL=http://localhost:5050/api,
  // Socket.IO still needs the backend origin, not the /api path.
  return raw.replace(/\\/api\\/?$/, "").replace(/\\/+$/, "");
}
"""

if old_base not in text:
    raise SystemExit("Could not find getSocketBaseUrl block.")

text = text.replace(old_base, new_base)

text = text.replace(
    'localStorage.getItem("ss.jwt") ||',
    'localStorage.getItem("ss.token") ||\n      localStorage.getItem("ss.jwt") ||'
)

text = text.replace(
    'transports: ["websocket", "polling"],',
    '// Polling first is more stable in local dev/proxy setups; Socket.IO can upgrade later.\n        transports: ["polling", "websocket"],\n        upgrade: true,\n        reconnection: true,\n        reconnectionAttempts: 8,\n        reconnectionDelay: 750,'
)

path.write_text(text)
print("Patched src/hooks/useSocket.ts")
