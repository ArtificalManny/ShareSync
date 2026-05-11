from pathlib import Path

path = Path("src/tasks/schemas/task.schema.ts")
text = path.read_text()

# ─────────────────────────────────────────────────────────────────────────────
# 1) Add backward-compatible assignment aliases
# ─────────────────────────────────────────────────────────────────────────────

assignee_anchor = """  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignee?: Types.ObjectId;
"""

assignee_insert = """  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignee?: Types.ObjectId;

  // Backward-compatible assignment aliases used by older task records.
  // These are optional and do not change the primary assigneeId field.
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  assignedTo?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  assignedToId?: Types.ObjectId;
"""

if "assignedToId?: Types.ObjectId;" not in text:
    if assignee_anchor not in text:
        raise SystemExit("Could not find assignee anchor. No changes written.")
    text = text.replace(assignee_anchor, assignee_insert, 1)
else:
    print("assignedTo / assignedToId already present. Skipping assignment alias insert.")

# ─────────────────────────────────────────────────────────────────────────────
# 2) Add backward-compatible creator alias
# ─────────────────────────────────────────────────────────────────────────────

created_by_anchor = """  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
"""

created_by_insert = """  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  // Backward-compatible creator alias used by older task records.
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  createdById?: Types.ObjectId;
"""

if "createdById?: Types.ObjectId;" not in text:
    if created_by_anchor not in text:
        raise SystemExit("Could not find createdBy anchor. No changes written.")
    text = text.replace(created_by_anchor, created_by_insert, 1)
else:
    print("createdById already present. Skipping creator alias insert.")

# ─────────────────────────────────────────────────────────────────────────────
# 3) Add supporting indexes for Daily Focus / priority task lookups
# ─────────────────────────────────────────────────────────────────────────────

index_anchor = """TaskSchema.index({ assigneeId: 1, status: 1 });
"""

index_insert = """TaskSchema.index({ assigneeId: 1, status: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ assignedToId: 1, status: 1 });
TaskSchema.index({ createdBy: 1, status: 1 });
TaskSchema.index({ createdById: 1, status: 1 });
TaskSchema.index({ reporterId: 1, status: 1 });
"""

if "TaskSchema.index({ assignedToId: 1, status: 1 });" not in text:
    if index_anchor not in text:
        raise SystemExit("Could not find assigneeId index anchor. No changes written.")
    text = text.replace(index_anchor, index_insert, 1)
else:
    print("Daily Focus alias indexes already present. Skipping index insert.")

# ─────────────────────────────────────────────────────────────────────────────
# 4) Expand pre-save alias synchronization
# ─────────────────────────────────────────────────────────────────────────────

old_presave_sync = """  if (doc.assigneeId && !doc.assignee) doc.assignee = doc.assigneeId;
  if (doc.assignee && !doc.assigneeId) doc.assigneeId = doc.assignee;

  if (doc.reporterId && !doc.reporter) doc.reporter = doc.reporterId;
  if (doc.reporter && !doc.reporterId) doc.reporterId = doc.reporter;
"""

new_presave_sync = """  const primaryAssignee =
    doc.assigneeId || doc.assignee || doc.assignedToId || doc.assignedTo;

  if (primaryAssignee) {
    if (!doc.assigneeId) doc.assigneeId = primaryAssignee;
    if (!doc.assignee) doc.assignee = primaryAssignee;
    if (!doc.assignedToId) doc.assignedToId = primaryAssignee;
    if (!doc.assignedTo) doc.assignedTo = primaryAssignee;
  }

  const primaryReporter = doc.reporterId || doc.reporter;

  if (primaryReporter) {
    if (!doc.reporterId) doc.reporterId = primaryReporter;
    if (!doc.reporter) doc.reporter = primaryReporter;
  }

  const primaryCreator = doc.createdBy || doc.createdById || doc.reporterId || doc.reporter;

  if (primaryCreator) {
    if (!doc.createdBy) doc.createdBy = primaryCreator;
    if (!doc.createdById) doc.createdById = primaryCreator;
  }
"""

if "const primaryAssignee =" not in text:
    if old_presave_sync not in text:
        raise SystemExit("Could not find pre-save sync block. No changes written.")
    text = text.replace(old_presave_sync, new_presave_sync, 1)
else:
    print("Expanded pre-save alias sync already present. Skipping pre-save patch.")

# ─────────────────────────────────────────────────────────────────────────────
# Safety checks
# ─────────────────────────────────────────────────────────────────────────────

required = [
    "assignedTo?: Types.ObjectId;",
    "assignedToId?: Types.ObjectId;",
    "createdById?: Types.ObjectId;",
    "TaskSchema.index({ assignedToId: 1, status: 1 });",
    "TaskSchema.index({ createdById: 1, status: 1 });",
    "const primaryAssignee =",
    "const primaryCreator =",
]

for item in required:
    if item not in text:
        raise SystemExit(f"Safety check failed: missing `{item}`. No changes written.")

path.write_text(text)

print("✅ Task schema now includes Daily Focus compatibility aliases.")
print("✅ Added indexes for assignedTo/assignedToId/createdBy/createdById/reporterId.")
print("✅ Expanded pre-save sync without removing existing fields.")
print("✅ No controller or service logic changed.")
