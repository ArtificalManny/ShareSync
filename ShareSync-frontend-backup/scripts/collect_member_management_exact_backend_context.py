#!/usr/bin/env python3
from pathlib import Path

BACKEND = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
FRONTEND = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")

FILES = [
    BACKEND / "src/projects/projects.controller.ts",
    BACKEND / "src/projects/projects.service.ts",
    BACKEND / "src/projects/projects.module.ts",
    BACKEND / "src/projects/schemas/project.schema.ts",
    BACKEND / "src/notifications/schemas/notification.schema.ts",
    BACKEND / "src/notifications/notifications.service.ts",
    BACKEND / "src/realtime/realtime.gateway.ts",
    FRONTEND / "src/api/projects.js",
    FRONTEND / "src/components/members/MembersPanel.jsx",
    FRONTEND / "src/components/members/MembersList.jsx",
]

NEEDLES = [
    "constructor(",
    "private readonly",
    "NotificationsService",
    "RealtimeGateway",
    "@Controller",
    "@Get",
    "@Post",
    "@Put",
    "@Patch",
    "@Delete",
    "@Param",
    "@Body",
    "@Req",
    "UseGuards",
    "Jwt",
    "Auth",
    "req.user",
    "request.user",
    "userId",
    "ownerId",
    "ProjectMember",
    "ProjectMemberSchema",
    "canManageMembers",
    "canEdit",
    "findById",
    "findOne",
    "save()",
    "members",
    "MemberRole",
    "NotificationType",
    "createBulk",
    "emitToProject",
]


def print_file_header(path):
    print("\n\n" + "═" * 110)
    print(path)
    print("═" * 110)


def print_first_lines(path, count=80):
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    print(f"\n--- FIRST {min(count, len(lines))} LINES ---")
    for i, line in enumerate(lines[:count], start=1):
        print(f"{i}: {line}")


def print_context(path, radius=22):
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    printed = []

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
    print("Collecting exact backend/frontend patch context for project member management...")

    for path in FILES:
        if not path.exists():
            print_file_header(path)
            print("MISSING")
            continue

        print_file_header(path)
        print_first_lines(path, 70)
        print_context(path)


if __name__ == "__main__":
    main()
