from pathlib import Path

path = Path("src/projects/schemas/project.schema.ts")
text = path.read_text()

# ─────────────────────────────────────────────────────────────────────────────
# 1) Add ProjectMember.memberId alias next to ProjectMember.userId
# ─────────────────────────────────────────────────────────────────────────────

old_member_user_id = """export class ProjectMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
"""

new_member_user_id = """export class ProjectMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // Backward-compatible member alias used by older/newer project membership lookups.
  // userId remains the primary field used by existing project member logic.
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  memberId?: Types.ObjectId;
"""

if "memberId?: Types.ObjectId;" not in text:
    if old_member_user_id not in text:
        raise SystemExit("Could not find ProjectMember.userId anchor. No changes written.")
    text = text.replace(old_member_user_id, new_member_user_id, 1)
else:
    print("memberId already exists. Skipping ProjectMember alias insert.")

# ─────────────────────────────────────────────────────────────────────────────
# 2) Add Project.createdBy / createdById aliases near ownerId / owner
# ─────────────────────────────────────────────────────────────────────────────

old_owner_block = """  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  owner?: Types.ObjectId;
"""

new_owner_block = """  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  owner?: Types.ObjectId;

  // Backward-compatible creator aliases used by Daily Focus and older project records.
  // ownerId remains the primary project ownership field.
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  createdById?: Types.ObjectId;
"""

if "createdById?: Types.ObjectId;" not in text:
    if old_owner_block not in text:
        raise SystemExit("Could not find ownerId/owner anchor. No changes written.")
    text = text.replace(old_owner_block, new_owner_block, 1)
else:
    print("createdBy / createdById already exist. Skipping project creator alias insert.")

# ─────────────────────────────────────────────────────────────────────────────
# 3) Add indexes used by Daily Focus / project ownership lookup compatibility
# ─────────────────────────────────────────────────────────────────────────────

index_anchor = """ProjectSchema.index({ ownerId: 1, status: 1 });
ProjectSchema.index({ 'members.userId': 1 });
"""

index_insert = """ProjectSchema.index({ ownerId: 1, status: 1 });
ProjectSchema.index({ owner: 1, status: 1 });
ProjectSchema.index({ createdBy: 1, status: 1 });
ProjectSchema.index({ createdById: 1, status: 1 });
ProjectSchema.index({ 'members.userId': 1 });
ProjectSchema.index({ 'members.user': 1 });
ProjectSchema.index({ 'members.memberId': 1 });
"""

if "ProjectSchema.index({ 'members.memberId': 1 });" not in text:
    if index_anchor not in text:
        raise SystemExit("Could not find project ownership/member index anchor. No changes written.")
    text = text.replace(index_anchor, index_insert, 1)
else:
    print("Daily Focus project alias indexes already present. Skipping index insert.")

# ─────────────────────────────────────────────────────────────────────────────
# 4) Add pre-save sync for owner/member aliases
# ─────────────────────────────────────────────────────────────────────────────

pre_save_block = """
// ═══════════════════════════════════════════════════════════════════════════════
// DAILY FOCUS / LEGACY ALIAS SYNC
// Keeps owner/member alias fields aligned without changing primary fields.
// ═══════════════════════════════════════════════════════════════════════════════

ProjectSchema.pre('save', function (next) {
  const doc = this as any;

  const primaryOwner = doc.ownerId || doc.owner || doc.createdBy || doc.createdById;

  if (primaryOwner) {
    if (!doc.ownerId) doc.ownerId = primaryOwner;
    if (!doc.owner) doc.owner = primaryOwner;
    if (!doc.createdBy) doc.createdBy = primaryOwner;
    if (!doc.createdById) doc.createdById = primaryOwner;
  }

  if (Array.isArray(doc.members)) {
    doc.members.forEach((member: any) => {
      const primaryMember = member?.userId || member?.user || member?.memberId;

      if (primaryMember) {
        if (!member.userId) member.userId = primaryMember;
        if (!member.memberId) member.memberId = primaryMember;
      }
    });
  }

  next();
});
"""

if "ProjectSchema.pre('save', function (next)" not in text:
    text = text.rstrip() + "\n" + pre_save_block + "\n"
else:
    print("ProjectSchema pre-save hook already exists. Skipping pre-save insert.")

# ─────────────────────────────────────────────────────────────────────────────
# Safety checks
# ─────────────────────────────────────────────────────────────────────────────

required = [
    "memberId?: Types.ObjectId;",
    "createdBy?: Types.ObjectId;",
    "createdById?: Types.ObjectId;",
    "ProjectSchema.index({ owner: 1, status: 1 });",
    "ProjectSchema.index({ createdBy: 1, status: 1 });",
    "ProjectSchema.index({ createdById: 1, status: 1 });",
    "ProjectSchema.index({ 'members.memberId': 1 });",
    "ProjectSchema.pre('save', function (next)",
    "const primaryOwner =",
    "const primaryMember =",
]

for item in required:
    if item not in text:
        raise SystemExit(f"Safety check failed: missing `{item}`. No changes written.")

path.write_text(text)

print("✅ Project schema now includes Daily Focus compatibility aliases.")
print("✅ Added memberId, createdBy, and createdById fields.")
print("✅ Added ownership/member alias indexes.")
print("✅ Added pre-save alias sync without changing primary ownerId/userId fields.")
