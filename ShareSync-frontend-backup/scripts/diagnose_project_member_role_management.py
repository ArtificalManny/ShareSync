#!/usr/bin/env python3
from pathlib import Path

FRONTEND = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
BACKEND = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")

FRONTEND_SRC = FRONTEND / "src"
BACKEND_SRC = BACKEND / "src"


def header(title):
    print("\n" + "═" * 100)
    print(title)
    print("═" * 100)


def exists(path):
    print(f"{path}: {'FOUND' if path.exists() else 'missing'}")


def read_text(path):
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return ""


def scan(root, patterns, suffixes=(".js", ".jsx", ".ts", ".tsx")):
    if not root.exists():
        print(f"\nRoot missing: {root}")
        return

    for path in root.rglob("*"):
        if not path.is_file() or path.suffix not in suffixes:
            continue

        text = read_text(path)
        if not text:
            continue

        hits = []
        lines = text.splitlines()

        for index, line in enumerate(lines, start=1):
            for pattern in patterns:
                if pattern in line:
                    hits.append((index, line.rstrip()))
                    break

        if hits:
            print(f"\n--- {path} ---")
            for line_no, line in hits[:80]:
                print(f"{line_no}: {line}")


def context(path, patterns, radius=8):
    text = read_text(path)
    if not text:
        return

    lines = text.splitlines()
    printed = []

    print(f"\n--- CONTEXT: {path} ---")

    for i, line in enumerate(lines):
        if any(pattern in line for pattern in patterns):
            start = max(0, i - radius)
            end = min(len(lines), i + radius + 1)

            if any(not (end < old_start or start > old_end) for old_start, old_end in printed):
                continue

            printed.append((start, end))
            print(f"\nlines {start + 1}-{end}")
            for j in range(start, end):
                print(f"{j + 1}: {lines[j]}")


def main():
    header("Project member role/removal diagnostic")

    print("\nFrontend root:")
    exists(FRONTEND)

    print("\nBackend root:")
    exists(BACKEND)

    header("Likely frontend files")
    frontend_candidates = [
        FRONTEND_SRC / "pages/ProjectHome.jsx",
        FRONTEND_SRC / "components/project/ProjectMembersModal.jsx",
        FRONTEND_SRC / "components/project/MembersModal.jsx",
        FRONTEND_SRC / "components/project/MemberModal.jsx",
        FRONTEND_SRC / "api/projects.js",
        FRONTEND_SRC / "api/client.js",
        FRONTEND_SRC / "contexts/SocketContext.jsx",
        FRONTEND_SRC / "contexts/NotificationsContext.jsx",
        FRONTEND_SRC / "context/AuthContext.jsx",
        FRONTEND_SRC / "context/AuthContext.js",
    ]
    for p in frontend_candidates:
        exists(p)

    header("Likely backend files")
    backend_candidates = [
        BACKEND_SRC / "projects/projects.controller.ts",
        BACKEND_SRC / "projects/projects.service.ts",
        BACKEND_SRC / "projects/schemas/project.schema.ts",
        BACKEND_SRC / "project/project.controller.ts",
        BACKEND_SRC / "project/project.service.ts",
        BACKEND_SRC / "project/schemas/project.schema.ts",
        BACKEND_SRC / "notifications/notifications.service.ts",
        BACKEND_SRC / "notifications/schemas/notification.schema.ts",
        BACKEND_SRC / "realtime/realtime.gateway.ts",
        BACKEND_SRC / "gateways/realtime.gateway.ts",
        BACKEND_SRC / "app.module.ts",
    ]
    for p in backend_candidates:
        exists(p)

    header("Frontend scan: find Project Members modal and member actions")
    scan(
        FRONTEND_SRC,
        [
            "Project Members",
            "members",
            "Members",
            "Invite",
            "Owner",
            "Member",
            "role",
            "remove",
            "Remove",
            "project.members",
            "setMembers",
            "onInvite",
            "MoreVertical",
            "Dropdown",
            "Menu",
            "ellipsis",
        ],
    )

    header("Frontend scan: project API helpers")
    scan(
        FRONTEND_SRC / "api",
        [
            "projects",
            "member",
            "members",
            "invite",
            "remove",
            "role",
            "patch",
            "delete",
            "client.",
            "axios",
        ],
    )

    header("Backend scan: project schema/member structure")
    scan(
        BACKEND_SRC,
        [
            "members",
            "member",
            "owner",
            "moderator",
            "role",
            "permission",
            "visibility",
            "isPublic",
            "ProjectSchema",
            "@Schema",
            "Prop",
            "ObjectId",
            "Types.ObjectId",
        ],
    )

    header("Backend scan: project routes/controller")
    scan(
        BACKEND_SRC,
        [
            "@Controller",
            "@Get",
            "@Post",
            "@Patch",
            "@Put",
            "@Delete",
            "Param",
            "Body",
            "Req",
            "UseGuards",
            "Jwt",
            "projects",
            "members",
            "invite",
            "remove",
            "role",
        ],
    )

    header("Backend scan: notifications/realtime")
    scan(
        BACKEND_SRC,
        [
            "Notification",
            "notification",
            "notify",
            "createNotification",
            "createMany",
            "recipient",
            "recipients",
            "emit",
            "server.to",
            "project room",
            "joinProject",
            "project:",
            "member",
            "role",
            "removed",
        ],
    )

    header("Focused context if likely files exist")
    for p in frontend_candidates + backend_candidates:
        if p.exists():
            context(
                p,
                [
                    "Project Members",
                    "members",
                    "Owner",
                    "Member",
                    "role",
                    "remove",
                    "@Patch",
                    "@Delete",
                    "Notification",
                    "emit",
                    "server.to",
                ],
                radius=10,
            )

    header("What to paste back")
    print("Paste this full diagnostic output back into ChatGPT.")
    print("Then we can implement safely in one backend pass and one frontend pass.")


if __name__ == "__main__":
    main()
