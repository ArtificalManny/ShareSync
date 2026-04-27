#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

CANDIDATES = [
    ROOT / "vite.config.js",
    ROOT / "vite.config.jsx",
    ROOT / "vite.config.ts",
    ROOT / "vite.config.mjs",
]

SERVER_BLOCK = '''  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5050",
        changeOrigin: true,
        secure: false,
      },
    },
  },
'''

def fail(message: str):
    print(f"\\n[fix_vite_api_proxy_5050] ERROR: {message}\\n", file=sys.stderr)
    sys.exit(1)

def backup(path: Path):
    backup_path = path.with_name(f"{path.name}.bak-api-proxy-5050-{STAMP}")
    backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"[fix_vite_api_proxy_5050] backup created: {backup_path}")

def find_config() -> Path:
    for path in CANDIDATES:
        if path.exists():
            return path

    fail("Could not find vite.config.js / vite.config.ts / vite.config.mjs.")

def replace_existing_target(source: str) -> tuple[str, bool]:
    # Update old localhost backend ports inside existing proxy config.
    updated = source

    updated = re.sub(
        r'target:\\s*["\\']http://localhost:(3000|5000|5001|8000)["\\']',
        'target: "http://localhost:5050"',
        updated,
    )

    if updated != source:
        return updated, True

    return source, False

def has_api_proxy(source: str) -> bool:
    return (
        '"/api"' in source
        or "'/api'" in source
    ) and "proxy" in source and "target" in source

def insert_server_block(source: str) -> str:
    # Prefer inserting after plugins array if present.
    plugin_patterns = [
        r'(plugins:\\s*\\[[\\s\\S]*?\\],\\s*)',
    ]

    for pattern in plugin_patterns:
        match = re.search(pattern, source)
        if match:
            insert_at = match.end()
            return source[:insert_at] + "\\n" + SERVER_BLOCK + source[insert_at:]

    # Fallback: insert right after defineConfig({
    marker = "defineConfig({"
    index = source.find(marker)

    if index == -1:
        fail("Could not find defineConfig({ in Vite config.")

    insert_at = index + len(marker)
    return source[:insert_at] + "\\n" + SERVER_BLOCK + source[insert_at:]

def main():
    print("[fix_vite_api_proxy_5050] starting")

    config_path = find_config()
    print(f"[fix_vite_api_proxy_5050] config: {config_path}")

    source = config_path.read_text(encoding="utf-8")
    original = source

    if "defineConfig" not in source:
        fail("Vite config does not appear to use defineConfig. Please paste the file.")

    source, changed_target = replace_existing_target(source)

    if changed_target:
        print("[fix_vite_api_proxy_5050] updated existing proxy target to localhost:5050")
    elif has_api_proxy(source):
        print("[fix_vite_api_proxy_5050] /api proxy already appears to exist; no target replacement was needed")
    else:
        print("[fix_vite_api_proxy_5050] inserting new /api proxy block")
        source = insert_server_block(source)

    required = [
        '"/api"',
        'target: "http://localhost:5050"',
        "changeOrigin: true",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    if source == original:
        print("[fix_vite_api_proxy_5050] no changes needed")
        return

    backup(config_path)
    config_path.write_text(source, encoding="utf-8")

    print(f"[fix_vite_api_proxy_5050] patched: {config_path}")
    print("")
    print("[fix_vite_api_proxy_5050] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"server:|proxy:|/api|localhost:5050|localhost:5001\" vite.config.* -C 6")
    print(f"  git diff -- {config_path.relative_to(ROOT)}")
    print("")
    print("IMPORTANT:")
    print("  Restart the frontend dev server after changing vite.config.*")
    print("  Ctrl+C the frontend terminal, then run npm run dev again.")

if __name__ == "__main__":
    main()
