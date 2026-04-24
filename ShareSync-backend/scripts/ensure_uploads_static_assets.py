from pathlib import Path
import re
import sys

ROOT = Path.cwd()
MAIN_TS = ROOT / "src/main.ts"

def fail(message):
    print(f"\n[ensure_uploads_static_assets] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[ensure_uploads_static_assets] starting")

    if not MAIN_TS.exists():
        fail("Could not find src/main.ts. Paste src/main.ts before patching static uploads.")

    source = MAIN_TS.read_text(encoding="utf-8")
    original = source

    if "useStaticAssets" in source and "prefix: '/uploads/'" in source:
        print("[ensure_uploads_static_assets] /uploads static serving already appears present")
        return

    if "NestExpressApplication" not in source:
        anchor = "import { NestFactory } from '@nestjs/core';\n"
        insert = (
            "import { NestFactory } from '@nestjs/core';\n"
            "import { NestExpressApplication } from '@nestjs/platform-express';\n"
        )

        if anchor not in source:
            fail("Could not find NestFactory import anchor. No changes were written.")

        source = source.replace(anchor, insert, 1)
        print("[ensure_uploads_static_assets] added NestExpressApplication import")

    if "import * as path from 'node:path';" not in source and 'from "node:path"' not in source:
        last_import_match = list(re.finditer(r"^import .*?;\n", source, flags=re.MULTILINE))
        if not last_import_match:
            fail("Could not find import block. No changes were written.")

        last = last_import_match[-1]
        source = source[:last.end()] + "import * as path from 'node:path';\n" + source[last.end():]
        print("[ensure_uploads_static_assets] added node:path import")

    create_pattern = r"NestFactory\.create\s*<[^>]+>\s*\("
    if not re.search(create_pattern, source):
        source = re.sub(
            r"NestFactory\.create\s*\(",
            "NestFactory.create<NestExpressApplication>(",
            source,
            count=1,
        )
        print("[ensure_uploads_static_assets] typed NestFactory.create as NestExpressApplication")
    else:
        print("[ensure_uploads_static_assets] NestFactory.create already has a generic type")

    create_line_match = re.search(r"const\s+app\s*=\s*await\s+NestFactory\.create[\s\S]*?\);\n", source)
    if not create_line_match:
        fail("Could not find `const app = await NestFactory.create...` block. No changes were written.")

    static_block = """
  // Serve locally uploaded files from <backend-root>/uploads.
  // Vault uploads store URLs like /uploads/vault-...jpg.
  app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
"""

    insert_at = create_line_match.end()
    source = source[:insert_at] + static_block + source[insert_at:]
    print("[ensure_uploads_static_assets] added app.useStaticAssets for /uploads")

    if source == original:
        print("[ensure_uploads_static_assets] no changes needed")
        return

    backup = MAIN_TS.with_suffix(MAIN_TS.suffix + ".bak-uploads-static")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[ensure_uploads_static_assets] backup created: {backup}")

    MAIN_TS.write_text(source, encoding="utf-8")
    print(f"[ensure_uploads_static_assets] patched: {MAIN_TS}")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"useStaticAssets|uploads|NestExpressApplication\" src/main.ts")

if __name__ == "__main__":
    main()
