#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/user/user.controller.ts"
SERVICE = ROOT / "src/user/user.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[wire_users_search_controller] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[wire_users_search_controller] starting")

    if not TARGET.exists():
        fail(f"Missing controller file: {TARGET}")

    if not SERVICE.exists():
        fail(f"Missing service file: {SERVICE}")

    source = TARGET.read_text(encoding="utf-8")
    original = source
    service_source = SERVICE.read_text(encoding="utf-8")

    required_markers = [
        "@Controller('users')",
        "export class UserController",
        "constructor(",
        "private readonly users: UserService,",
        "@Get('me')",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected controller marker before patch: {marker}")

    service_method_candidates = [
        "searchGlobalUsers(",
        "searchUsers(",
        "globalSearch(",
    ]

    found_method = None
    for candidate in service_method_candidates:
        if candidate in service_source:
            found_method = candidate.replace("(", "")
            break

    if not found_method:
        fail(
            "No compatible user search method found in src/user/user.service.ts. "
            "Do NOT patch the controller yet. Next, paste src/user/user.service.ts so we can add "
            "a safe searchGlobalUsers(query, limit) method first."
        )

    if "@Get('search')" in source or '@Get("search")' in source:
        print("[wire_users_search_controller] /users/search route already exists")
        return

    helper_block = """
  private parseSearchLimit(rawLimit: any): number {
    const parsed = Number(rawLimit || 20);

    if (!Number.isFinite(parsed)) {
      return 20;
    }

    return Math.min(Math.max(Math.trunc(parsed), 1), 50);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/search - Global people search
  // Used by Search.jsx / Navbar universal search.
  // Must stay before any dynamic @Get(':id') route.
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchUsers(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    const query = String(q || '').trim();

    if (!query || query.length < 2) {
      return {
        success: true,
        data: [],
      };
    }

    const safeLimit = this.parseSearchLimit(limit);
    const users = await (this.users as any).searchGlobalUsers(query, safeLimit);

    return {
      success: true,
      data: users,
    };
  }
"""

    insertion_marker = "  // ─────────────────────────────────────────────────────────────────────────────\n  // GET /users/me - Get current user profile"
    if insertion_marker not in source:
        fail("Could not find insertion point before GET /users/me.")

    source = source.replace(insertion_marker, helper_block + "\n" + insertion_marker, 1)

    required_after = [
        "private parseSearchLimit(rawLimit: any): number",
        "@Get('search')",
        "async searchUsers(",
        "const users = await (this.users as any).searchGlobalUsers(query, safeLimit);",
        "success: true",
        "data: users",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    backup = TARGET.with_name(f"{TARGET.name}.bak-users-search-controller-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[wire_users_search_controller] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[wire_users_search_controller] patched: {TARGET}")

    print("")
    print("[wire_users_search_controller] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"parseSearchLimit|Get\\('search'\\)|searchUsers|searchGlobalUsers|Get\\('me'\\)|Get\\(':id'\\)\" src/user/user.controller.ts src/user/user.service.ts -C 8")
    print("  git diff -- src/user/user.controller.ts")


if __name__ == "__main__":
    main()
