#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/App.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[add_users_profile_route_alias] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[add_users_profile_route_alias] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "BrowserRouter as Router,",
        "Navigate,",
        "useLocation,",
        '<Route path="/profile/:username" element={<PublicProfile />} />',
        '<Route path="*" element={<Navigate to="/" replace />} />',
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Add useParams import.
    if "useParams," not in source:
        old_import = """  Navigate,
  useLocation,
} from "react-router-dom";"""
        new_import = """  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";"""

        if old_import not in source:
            fail("Could not find react-router-dom import block to add useParams.")

        source = source.replace(old_import, new_import, 1)
        print("[add_users_profile_route_alias] added useParams import")
    else:
        print("[add_users_profile_route_alias] useParams import already present")

    # 2) Add compatibility redirect component before AppRoutes.
    if "function UserProfileAlias()" not in source:
        marker = """function AppRoutes() {"""
        component = """function UserProfileAlias() {
  const { username } = useParams();
  const safeUsername = encodeURIComponent(username || "");

  return <Navigate to={`/profile/${safeUsername}`} replace />;
}

"""

        if marker not in source:
            fail("Could not find AppRoutes insertion marker.")

        source = source.replace(marker, component + marker, 1)
        print("[add_users_profile_route_alias] added UserProfileAlias component")
    else:
        print("[add_users_profile_route_alias] UserProfileAlias already present")

    # 3) Add /users/:username route immediately after /profile/:username.
    if 'path="/users/:username"' not in source:
        old_route = """              <Route path="/profile/:username" element={<PublicProfile />} />"""
        new_route = """              <Route path="/profile/:username" element={<PublicProfile />} />
              <Route path="/users/:username" element={<UserProfileAlias />} />"""

        if old_route not in source:
            fail("Could not find /profile/:username route insertion point.")

        source = source.replace(old_route, new_route, 1)
        print("[add_users_profile_route_alias] added /users/:username redirect route")
    else:
        print("[add_users_profile_route_alias] /users/:username route already present")

    required_after = [
        "useParams,",
        "function UserProfileAlias()",
        "const { username } = useParams();",
        "return <Navigate to={`/profile/${safeUsername}`} replace />;",
        '<Route path="/profile/:username" element={<PublicProfile />} />',
        '<Route path="/users/:username" element={<UserProfileAlias />} />',
        '<Route path="*" element={<Navigate to="/" replace />} />',
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Post-edit safety check failed. Missing marker: {marker}")

    if source == original:
        print("[add_users_profile_route_alias] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-users-profile-alias-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[add_users_profile_route_alias] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[add_users_profile_route_alias] patched: {TARGET}")

    print("")
    print("[add_users_profile_route_alias] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"useParams|UserProfileAlias|/profile/:username|/users/:username|path=\\\"\\*\\\"\" src/App.jsx -C 8")
    print("  git diff -- src/App.jsx")


if __name__ == "__main__":
    main()
