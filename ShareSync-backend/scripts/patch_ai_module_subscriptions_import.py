from pathlib import Path
from datetime import datetime

TARGET = Path("src/ai/ai.module.ts")

def backup(path: Path):
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = path.with_suffix(path.suffix + f".bak.subscriptions-module-{stamp}")
    backup_path.write_text(path.read_text())
    print(f"[backup] {backup_path}")

def find_matching_bracket(text: str, open_index: int) -> int:
    depth = 0
    quote = None
    escape = False

    for i in range(open_index, len(text)):
        ch = text[i]

        if quote:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == quote:
                quote = None
            continue

        if ch in ("'", '"', "`"):
            quote = ch
            continue

        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                return i

    return -1

def main():
    print("[patch_ai_module_subscriptions_import] starting")

    if not TARGET.exists():
        raise SystemExit("[ERROR] src/ai/ai.module.ts not found")

    text = TARGET.read_text()
    original = text
    backup(TARGET)

    import_line = "import { SubscriptionsModule } from '../subscriptions/subscriptions.module';"

    if import_line not in text:
        # Add after the @nestjs/common Module import.
        common_import = "import { Module } from '@nestjs/common';"
        if common_import not in text:
            raise SystemExit("[ERROR] Could not find Nest Module import")

        text = text.replace(
            common_import,
            common_import + "\n" + import_line,
            1
        )
        print("[patched] added SubscriptionsModule import")
    else:
        print("[skip] SubscriptionsModule import already exists")

    if "SubscriptionsModule" in text and "imports" in text:
        imports_pos = text.find("imports")
        colon_pos = text.find(":", imports_pos)
        bracket_pos = text.find("[", colon_pos)

        if imports_pos != -1 and colon_pos != -1 and bracket_pos != -1:
            close_pos = find_matching_bracket(text, bracket_pos)

            if close_pos == -1:
                raise SystemExit("[ERROR] Could not find matching closing bracket for imports array")

            imports_body = text[bracket_pos + 1:close_pos]

            if "SubscriptionsModule" not in imports_body:
                text = (
                    text[:bracket_pos + 1]
                    + "\n    SubscriptionsModule,"
                    + text[bracket_pos + 1:]
                )
                print("[patched] added SubscriptionsModule to existing imports array")
            else:
                print("[skip] SubscriptionsModule already inside imports array")
        else:
            # If file has no usable imports array, add one.
            module_marker = "@Module({"
            if module_marker not in text:
                raise SystemExit("[ERROR] Could not find @Module({ marker")

            text = text.replace(
                module_marker,
                "@Module({\n  imports: [SubscriptionsModule],",
                1
            )
            print("[patched] created imports array with SubscriptionsModule")
    else:
        module_marker = "@Module({"
        if module_marker not in text:
            raise SystemExit("[ERROR] Could not find @Module({ marker")

        text = text.replace(
            module_marker,
            "@Module({\n  imports: [SubscriptionsModule],",
            1
        )
        print("[patched] created imports array with SubscriptionsModule")

    if text == original:
        print("[info] no changes needed")

    TARGET.write_text(text)

    print()
    print("[patch_ai_module_subscriptions_import] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "SubscriptionsModule|chargeAiCall|getRequestUserId|TooManyRequestsException|aiCalls" src/ai -C 6')
    print("  git diff -- src/ai/ai.controller.ts src/ai/ai.module.ts")

if __name__ == "__main__":
    main()
