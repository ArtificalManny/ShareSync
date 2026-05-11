from pathlib import Path

path = Path("src/tasks/tasks.service.ts")
text = path.read_text()

function_marker = "  async getMyPriorityTasks("
next_function_marker = "\n  async update("

start = text.find(function_marker)
if start == -1:
    raise SystemExit("Could not find getMyPriorityTasks function. No changes written.")

end = text.find(next_function_marker, start)
if end == -1:
    raise SystemExit("Could not find end of getMyPriorityTasks before async update. No changes written.")

before = text[:start]
chunk = text[start:end]
after = text[end:]

old_or_block = """        $or: [
          { assigneeId: new Types.ObjectId(userId) },
          { assignee: new Types.ObjectId(userId) },
          { createdBy: new Types.ObjectId(userId) },
          { reporterId: new Types.ObjectId(userId) },
          { reporter: new Types.ObjectId(userId) },
        ],"""

new_or_block = """        $or: [
          // Current task ownership/assignment fields
          { assigneeId: userObjectId },
          { assignee: userObjectId },
          { reporterId: userObjectId },
          { reporter: userObjectId },

          // Backward-compatible / alternate field names used by older task records
          { createdBy: userObjectId },
          { createdById: userObjectId },
          { assignedTo: userObjectId },
          { assignedToId: userObjectId },
        ],"""

if old_or_block not in chunk:
    print("Could not find the current $or block inside getMyPriorityTasks.")
    print("No changes written.")
    print("")
    print("Showing getMyPriorityTasks function for inspection:")
    lines = chunk.splitlines()
    for i, line in enumerate(lines, start=1):
        print(f"{i:04d}: {line}")
    raise SystemExit(1)

if "const userObjectId = new Types.ObjectId(userId);" not in chunk:
    task_query_marker = "    const tasks = await this.taskModel\n"
    if task_query_marker not in chunk:
        raise SystemExit("Could not find task query marker. No changes written.")

    chunk = chunk.replace(
        task_query_marker,
        "    const userObjectId = new Types.ObjectId(userId);\n\n" + task_query_marker,
        1,
    )

chunk = chunk.replace(old_or_block, new_or_block, 1)

new_text = before + chunk + after

if new_text.count("async getMyPriorityTasks(") != 1:
    raise SystemExit("Safety check failed: getMyPriorityTasks count changed. No changes written.")

required = [
    "const userObjectId = new Types.ObjectId(userId);",
    "{ assigneeId: userObjectId }",
    "{ assignee: userObjectId }",
    "{ reporterId: userObjectId }",
    "{ reporter: userObjectId }",
    "{ createdBy: userObjectId }",
    "{ createdById: userObjectId }",
    "{ assignedTo: userObjectId }",
    "{ assignedToId: userObjectId }",
]

for item in required:
    if item not in new_text:
        raise SystemExit(f"Safety check failed: missing `{item}`. No changes written.")

path.write_text(new_text)

print("✅ getMyPriorityTasks now uses one safe userObjectId.")
print("✅ Added createdById, assignedTo, and assignedToId compatibility fields.")
print("✅ Still user-scoped. No global task fallback added.")
print("✅ No controller/module wiring changed.")
