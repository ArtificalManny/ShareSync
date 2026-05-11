from pathlib import Path

path = Path("src/projects/projects.service.ts")
text = path.read_text()

old = """    const query: any = {
      $or: [
        { ownerId: new Types.ObjectId(userId) },
        { owner: new Types.ObjectId(userId) },
        { 'members.userId': new Types.ObjectId(userId) },
        { 'members.user': new Types.ObjectId(userId) },
      ],
      isArchived: { $ne: true },
    };"""

new = """    const userObjectId = new Types.ObjectId(userId);

    const query: any = {
      $or: [
        // Current owner/member fields
        { ownerId: userObjectId },
        { owner: userObjectId },
        { 'members.userId': userObjectId },
        { 'members.user': userObjectId },

        // Backward-compatible / alternate project ownership fields
        { createdBy: userObjectId },
        { createdById: userObjectId },
        { 'members.memberId': userObjectId },
      ],
      isArchived: { $ne: true },
    };"""

if old not in text:
    print("Could not find the exact findUserProjects query block.")
    print("No changes written.")
    print("")
    print("Showing nearby code:")
    lines = text.splitlines()
    for i, line in enumerate(lines, start=1):
        if "async findUserProjects" in line:
            start = max(1, i - 5)
            end = min(len(lines), i + 55)
            for n in range(start, end + 1):
                print(f"{n:04d}: {lines[n - 1]}")
            break
    raise SystemExit(1)

text = text.replace(old, new, 1)

required = [
    "const userObjectId = new Types.ObjectId(userId);",
    "{ ownerId: userObjectId }",
    "{ owner: userObjectId }",
    "{ 'members.userId': userObjectId }",
    "{ 'members.user': userObjectId }",
    "{ createdBy: userObjectId }",
    "{ createdById: userObjectId }",
    "{ 'members.memberId': userObjectId }",
]

for item in required:
    if item not in text:
        raise SystemExit(f"Safety check failed: missing `{item}`. No changes written.")

path.write_text(text)

print("✅ findUserProjects now matches Daily Focus project ownership/member aliases.")
print("✅ Added createdBy, createdById, and members.memberId compatibility fields.")
print("✅ No write-permission logic changed.")
print("✅ No Daily Focus files touched.")
