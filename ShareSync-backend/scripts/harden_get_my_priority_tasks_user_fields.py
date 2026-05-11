from pathlib import Path

path = Path("src/tasks/tasks.service.ts")
text = path.read_text()

old = """    const tasks = await this.taskModel
      .find({
        ...(projectId ? { projectId: new Types.ObjectId(projectId) } : {}),
        $or: [
          { assigneeId: new Types.ObjectId(userId) },
          { assignee: new Types.ObjectId(userId) },
          { reporterId: new Types.ObjectId(userId) },
          { reporter: new Types.ObjectId(userId) },
        ],
        status: { $in: ['todo', 'in_progress', 'backlog', 'TODO', 'IN_PROGRESS', 'BACKLOG'] },
        completedAt: null,
      })"""

new = """    const userObjectId = new Types.ObjectId(userId);

    const tasks = await this.taskModel
      .find({
        ...(projectId ? { projectId: new Types.ObjectId(projectId) } : {}),
        $or: [
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
        ],
        status: { $in: ['todo', 'in_progress', 'backlog', 'TODO', 'IN_PROGRESS', 'BACKLOG'] },
        completedAt: null,
      })"""

if old not in text:
    print("Could not find the exact getMyPriorityTasks query block.")
    print("No changes written.")
    print("")
    print("Showing nearby code:")
    lines = text.splitlines()
    for i, line in enumerate(lines, start=1):
        if "async getMyPriorityTasks" in line:
            start = max(1, i - 5)
            end = min(len(lines), i + 60)
            for n in range(start, end + 1):
                print(f"{n:04d}: {lines[n - 1]}")
            break
    raise SystemExit(1)

text = text.replace(old, new, 1)

if text.count("const userObjectId = new Types.ObjectId(userId);") != 1:
    raise SystemExit("Safety check failed: userObjectId insertion count is not exactly 1. No changes written.")

if "createdById: userObjectId" not in text:
    raise SystemExit("Safety check failed: createdById compatibility field was not added. No changes written.")

if "assignedToId: userObjectId" not in text:
    raise SystemExit("Safety check failed: assignedToId compatibility field was not added. No changes written.")

path.write_text(text)

print("✅ getMyPriorityTasks now supports current + legacy user task fields.")
print("✅ Still user-scoped. No global task fallback added.")
print("✅ No controller/module/backend wiring changed.")
