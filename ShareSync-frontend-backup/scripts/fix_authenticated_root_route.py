from pathlib import Path
from datetime import datetime
import re

TARGET = Path("src/App.jsx")

ROOT_GUARD = """
function RootRouteRedirect() {
  const { user: authUser, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (authUser) {
    return <Navigate to="/home" replace />;
  }

  return <Landing />;
}

"""


def main():
    print("[fix_authenticated_root_route] starting")

    if not TARGET.exists():
        raise SystemExit(f"[fix_authenticated_root_route] ERROR: missing {TARGET}")

    text = TARGET.read_text()

    if "function RootRouteRedirect()" in text:
        print("[fix_authenticated_root_route] RootRouteRedirect already exists; skipping insertion")
        updated = text
    else:
        insert_markers = [
            "function UserProfileAlias()",
            "function AppRoutes()",
        ]

        insert_at = -1
        marker_used = None

        for marker in insert_markers:
            insert_at = text.find(marker)
            if insert_at != -1:
                marker_used = marker
                break

        if insert_at == -1:
            raise SystemExit(
                "[fix_authenticated_root_route] ERROR: could not find insertion point before UserProfileAlias/AppRoutes"
            )

        updated = text[:insert_at] + ROOT_GUARD + text[insert_at:]
        print(f"[fix_authenticated_root_route] inserted RootRouteRedirect before {marker_used}")

    root_route_patterns = [
        re.compile(r'<Route\s+path=["\']/["\']\s+element=\{\s*<Landing\s*/>\s*\}\s*/>', re.DOTALL),
        re.compile(r'<Route\s+element=\{\s*<Landing\s*/>\s*\}\s+path=["\']/["\']\s*/>', re.DOTALL),
    ]

    replacement = '<Route path="/" element={<RootRouteRedirect />} />'

    replaced = False
    for pattern in root_route_patterns:
        if pattern.search(updated):
            updated = pattern.sub(replacement, updated, count=1)
            replaced = True
            print("[fix_authenticated_root_route] replaced raw / Landing route")
            break

    if not replaced:
        if '<Route path="/" element={<RootRouteRedirect />} />' in updated:
            print("[fix_authenticated_root_route] root route already uses RootRouteRedirect")
        else:
            raise SystemExit(
                "[fix_authenticated_root_route] ERROR: could not find raw root Landing route. Run: rg -n \"path=\\\"/\\\"|Landing|RootRouteRedirect\" src/App.jsx -C 8"
            )

    backup = TARGET.with_suffix(
        TARGET.suffix + f".bak.before-authenticated-root-route-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    backup.write_text(text)

    TARGET.write_text(updated)

    print(f"[fix_authenticated_root_route] backup created: {backup}")
    print("[fix_authenticated_root_route] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "RootRouteRedirect|path=\\\"/\\\"|Landing|Navigate to=\\\"/home\\\"" src/App.jsx -C 8')
    print("  git diff -- src/App.jsx")


if __name__ == "__main__":
    main()
