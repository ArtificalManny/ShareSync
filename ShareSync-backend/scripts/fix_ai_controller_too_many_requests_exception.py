from pathlib import Path
from datetime import datetime

TARGET = Path("src/ai/ai.controller.ts")

def backup(path: Path):
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = path.with_suffix(path.suffix + f".bak.429-exception-{stamp}")
    backup_path.write_text(path.read_text())
    print(f"[backup] {backup_path}")

def replace_once(text: str, old: str, new: str, label: str):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"[ERROR] {label}: expected 1 occurrence, found {count}")
    return text.replace(old, new, 1)

def main():
    print("[fix_ai_controller_too_many_requests_exception] starting")

    if not TARGET.exists():
        raise SystemExit("[ERROR] src/ai/ai.controller.ts not found")

    text = TARGET.read_text()
    backup(TARGET)

    text = replace_once(
        text,
        "import { Body, Controller, Get, Post, Query, Req, TooManyRequestsException, UseGuards } from '@nestjs/common';",
        "import { Body, Controller, Get, HttpException, HttpStatus, Post, Query, Req, UseGuards } from '@nestjs/common';",
        "Nest common import"
    )

    text = replace_once(
        text,
        """      throw new TooManyRequestsException(
        `AI call limit reached for your current plan. Limit: ${usageCheck.limit}.`,
      );""",
        """      throw new HttpException(
        `AI call limit reached for your current plan. Limit: ${usageCheck.limit}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );""",
        "429 exception block"
    )

    if "TooManyRequestsException" in text:
        raise SystemExit("[ERROR] TooManyRequestsException still exists after patch")

    TARGET.write_text(text)

    print("[fix_ai_controller_too_many_requests_exception] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "HttpException|HttpStatus|TOO_MANY_REQUESTS|TooManyRequestsException|chargeAiCall|aiCalls" src/ai/ai.controller.ts -C 6')
    print("  git diff -- src/ai/ai.controller.ts")

if __name__ == "__main__":
    main()
