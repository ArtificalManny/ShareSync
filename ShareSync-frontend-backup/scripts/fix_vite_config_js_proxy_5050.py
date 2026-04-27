#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "vite.config.js"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[fix_vite_config_js_proxy_5050] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def backup(path: Path):
    backup_path = path.with_name(f"{path.name}.bak-proxy-5050-{STAMP}")
    backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"[fix_vite_config_js_proxy_5050] backup created: {backup_path}")


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        fail(f"Expected exactly 1 match for {label}, found {count}. No changes were written.")
    print(f"[fix_vite_config_js_proxy_5050] replacing: {label}")
    return source.replace(old, new, 1)


def main():
    print("[fix_vite_config_js_proxy_5050] starting")

    if not TARGET.exists():
        fail(f"Missing vite.config.js: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_before = [
        "server:",
        "port: 54693",
        "proxy: null",
    ]

    for marker in required_before:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    old = "    proxy: null,"
    new = """    proxy: {
      "/api": {
        target: "http://localhost:5050",
        changeOrigin: true,
        secure: false,
      },
    },"""

    source = replace_once(
        source,
        old,
        new,
        "replace proxy null with backend API proxy"
    )

    required_after = [
        'proxy: {',
        '"/api": {',
        'target: "http://localhost:5050"',
        "changeOrigin: true",
        "secure: false",
        "port: 54693",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if "proxy: null" in source:
        fail("Safety check failed: proxy: null still exists.")

    if source == original:
        fail("No changes detected. No file was written.")

    backup(TARGET)
    TARGET.write_text(source, encoding="utf-8")

    print(f"[fix_vite_config_js_proxy_5050] patched: {TARGET}")
    print("")
    print("[fix_vite_config_js_proxy_5050] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"server:|port: 54693|proxy:|/api|localhost:5050|proxy: null\" vite.config.js -C 8")
    print("  git diff -- vite.config.js")
    print("")
    print("IMPORTANT:")
    print("  Restart the frontend dev server after this.")
    print("  Ctrl+C frontend terminal, then npm run dev again.")


if __name__ == "__main__":
    main()
