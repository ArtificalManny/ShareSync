from pathlib import Path
import re

service_path = Path("src/notifications/notifications.service.ts")
module_path = Path("src/notifications/notifications.module.ts")

if not service_path.exists():
    raise SystemExit(f"Missing file: {service_path}")

if not module_path.exists():
    raise SystemExit(f"Missing file: {module_path}")

service = service_path.read_text()
module = module_path.read_text()

# ─────────────────────────────────────────────────────────────
# 1. Ensure NotificationsService can access User model by email
# ─────────────────────────────────────────────────────────────

user_schema_candidates = [
    Path("src/users/schemas/user.schema.ts"),
    Path("src/user/schemas/user.schema.ts"),
    Path("src/auth/schemas/user.schema.ts"),
]

user_schema_path = next((p for p in user_schema_candidates if p.exists()), None)

if not user_schema_path:
    raise SystemExit(
        "Could not find user.schema.ts. Checked: "
        + ", ".join(str(p) for p in user_schema_candidates)
    )

# Import path from src/notifications/notifications.service.ts to user schema
if user_schema_path == Path("src/users/schemas/user.schema.ts"):
    user_import = "../users/schemas/user.schema"
elif user_schema_path == Path("src/user/schemas/user.schema.ts"):
    user_import = "../user/schemas/user.schema"
else:
    user_import = "../auth/schemas/user.schema"

if "UserDocument" not in service:
    import_anchor = "} from './schemas/notification.schema';"

    user_import_line = f"\nimport {{ User, UserDocument }} from '{user_import}';"

    if import_anchor not in service:
        raise SystemExit("Could not find notification schema import anchor in NotificationsService.")

    service = service.replace(import_anchor, import_anchor + user_import_line, 1)

# Add userModel injection after notification model injection if not already there
if "private readonly userModel" not in service:
    constructor_pattern = re.compile(
        r"(constructor\s*\(\s*[\s\S]*?@InjectModel\(Notification\.name\)\s*private readonly notificationModel: Model<NotificationDocument>,)"
    )

    match = constructor_pattern.search(service)

    if not match:
        raise SystemExit("Could not find notificationModel constructor injection.")

    replacement = match.group(1) + """

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,"""

    service = service[:match.start()] + replacement + service[match.end():]

# ─────────────────────────────────────────────────────────────
# 2. Add @OnEvent('project.invite.created') listener
# ─────────────────────────────────────────────────────────────

if "@OnEvent('project.invite.created')" not in service:
    handler = """
  @OnEvent('project.invite.created')
  async handleProjectInviteCreated(payload: {
    projectId: string;
    projectName: string;
    inviteeEmail: string;
    inviteToken: string;
    role: string;
    invitedBy: string;
  }) {
    const email = String(payload?.inviteeEmail || '').trim().toLowerCase();

    if (!email || !payload?.inviteToken || !payload?.projectId) {
      this.logger.warn('[NotificationsService] Skipping project invite notification: missing invite payload.');
      return;
    }

    const invitee = await this.userModel
      .findOne({ email })
      .select('_id email username firstName lastName')
      .lean();

    if (!invitee?._id) {
      this.logger.log(
        `[NotificationsService] Invite notification skipped. No local user found for ${email}. Email delivery/local invite link still applies.`,
      );
      return;
    }

    const inviteeId = String(invitee._id);
    const projectName = payload.projectName || 'this project';
    const roleLabel = payload.role
      ? String(payload.role).charAt(0).toUpperCase() + String(payload.role).slice(1)
      : 'Member';

    await this.notify({
      userId: inviteeId,
      type: NotificationType.PROJECT_INVITE,
      title: 'Project invitation',
      body: `You were invited to join ${projectName} as ${roleLabel}.`,
      icon: '👋',
      priority: NotificationPriority.HIGH,
      triggeredBy: payload.invitedBy,
      data: {
        projectId: payload.projectId,
        projectName,
        inviteToken: payload.inviteToken,
        inviteeEmail: email,
        role: payload.role,
      },
      actions: [
        {
          label: 'Accept Invite',
          url: `/invite/${payload.inviteToken}`,
        },
        {
          label: 'View Projects',
          url: '/projects',
        },
      ],
      groupKey: `project-invite-${payload.projectId}-${inviteeId}-${payload.inviteToken}`,
    });

    this.logger.log(
      `[NotificationsService] Project invite notification created for ${email} on ${projectName}.`,
    );
  }

"""

    insert_anchor = "  @OnEvent('project.member.added')"

    if insert_anchor not in service:
        raise SystemExit("Could not find project.member.added handler anchor.")

    service = service.replace(insert_anchor, handler + insert_anchor, 1)

service_path.write_text(service)

# ─────────────────────────────────────────────────────────────
# 3. Register User schema in NotificationsModule
# ─────────────────────────────────────────────────────────────

if "UserSchema" not in module:
    module_import_anchor = "import { Notification, NotificationSchema } from './schemas/notification.schema';"

    if module_import_anchor not in module:
        raise SystemExit("Could not find Notification schema import in NotificationsModule.")

    module = module.replace(
        module_import_anchor,
        module_import_anchor + f"\nimport {{ User, UserSchema }} from '{user_import}';",
        1,
    )

# Add User model to MongooseModule.forFeature array
if "{ name: User.name, schema: UserSchema }" not in module:
    module = re.sub(
        r"(MongooseModule\.forFeature\(\s*\[\s*)",
        r"\1{ name: User.name, schema: UserSchema },\n      ",
        module,
        count=1,
    )

module_path.write_text(module)

print("Wired project.invite.created into NotificationsService.")
print(f"Used user schema import: {user_import}")
