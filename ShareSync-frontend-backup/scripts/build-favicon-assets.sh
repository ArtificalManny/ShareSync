#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup"
PUBLIC="$ROOT/public"
SRC="$PUBLIC/openshare-icon.svg"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

if [[ ! -f "$SRC" ]]; then
  echo "❌ Missing source SVG: $SRC"
  exit 1
fi

echo "→ Using source SVG: $SRC"

# Remove broken empty favicon.ico if present
if [[ -f "$PUBLIC/favicon.ico" && ! -s "$PUBLIC/favicon.ico" ]]; then
  echo "→ Removing empty favicon.ico"
  rm -f "$PUBLIC/favicon.ico"
fi

# Render SVG to PNG using macOS Quick Look
echo "→ Rendering SVG with qlmanage"
qlmanage -t -s 1024 -o "$TMP_DIR" "$SRC" >/dev/null 2>&1 || true

RENDERED="$TMP_DIR/$(basename "$SRC").png"

if [[ ! -f "$RENDERED" ]]; then
  echo "❌ Failed to render SVG with qlmanage"
  echo "   Try opening $SRC in Finder once, then rerun this script."
  exit 1
fi

echo "→ Generating PNG assets"
sips -z 16 16 "$RENDERED" --out "$PUBLIC/favicon-16x16.png" >/dev/null
sips -z 32 32 "$RENDERED" --out "$PUBLIC/favicon-32x32.png" >/dev/null
sips -z 180 180 "$RENDERED" --out "$PUBLIC/apple-touch-icon.png" >/dev/null

echo "→ Copying pinned-tab SVG"
cp "$SRC" "$PUBLIC/safari-pinned-tab.svg"

echo
echo "✅ Generated assets:"
ls -lh \
  "$PUBLIC/favicon-16x16.png" \
  "$PUBLIC/favicon-32x32.png" \
  "$PUBLIC/apple-touch-icon.png" \
  "$PUBLIC/safari-pinned-tab.svg"
