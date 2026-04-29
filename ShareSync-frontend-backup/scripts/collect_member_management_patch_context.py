#!/usr/bin/env python3
from pathlib import Path

FRONTEND = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
BACKEND = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")

FILES = [
    BACKEND / "src/projects/schemas/project.schema.ts",
    BACKEND / "src/projects/projects.controller.ts",
    BACKEND / "src/projects/projects.service.ts",
    BACKEND / "src/projects/projects.module.ts",
    BACKEND / "src/notifications/schemas/notification.schema.ts",
    FRONTEND / "src/api/projects.js",
    FRONTEND / "src/components/members/MembersPanel.jsx",
    FRONTEND / "src/components/members/MembersList.jsx",
]


NEEDLES = [
    "ProjectMember",
    "ProjectMemberSchema",
    "members",
    "ownerId",
    "owner",
    "role",
    "admin",
    "member",
    "@Controller",
    "@Patch",
    "@Delete",
    "Param",
    "Body",
    "Req",
    "UseGuards",
    "NotificationsService",
    "RealtimeGateway",
    "emitToProject",
    "NotificationType",
    "PROJECT_UPDATE",
    "client.",
    "function",
    "export",
]


def print_context(path, radius=18):
    if not path.exists():
        print(f"\n\nMISSING: {path}")
        return

    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    printed = []

    print("\n\n" + "═" * 100)
    print(path)
    print("═" * 100)

    for i, line in enumerate(lines):
        if any(needle in line for needle in NEEDLES):
            start = max(0, i - radius)
            end = min(len(lines), i + radius + 1)

            if any(not (end < old_start or start > old_end) for old_start, old_end in printed):
                continue

            printed.append((start, end))
            print(f"\n--- lines {start + 1}-{end} ---")
            for j in range(start, end):
                print(f"{j + 1}: {lines[j]}")


def main():
    print("Collecting exact patch context for project member role/removal feature...")
    for file in FILES:
        print_context(file)


if __name__ == "__main__":
    main()
