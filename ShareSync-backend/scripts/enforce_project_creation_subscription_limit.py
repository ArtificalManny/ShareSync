from pathlib import Path

service_path = Path("src/projects/projects.service.ts")
module_path = Path("src/projects/projects.module.ts")

service = service_path.read_text()
module = module_path.read_text()

# 1) Import SubscriptionsService into ProjectsService
service_import = "import { SubscriptionsService } from '../subscriptions/subscriptions.service';\n"
service_import_anchor = "import { NotificationPriority, NotificationType } from '../notifications/schemas/notification.schema';\n"

if service_import not in service:
    if service_import_anchor not in service:
        raise SystemExit("Could not find notification schema import anchor in projects.service.ts.")
    service = service.replace(service_import_anchor, service_import_anchor + service_import, 1)

# 2) Inject SubscriptionsService before the optional NotificationsService
old_constructor_block = """    private readonly eventEmitter: EventEmitter2,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}"""

new_constructor_block = """    private readonly eventEmitter: EventEmitter2,
    private readonly subscriptionsService: SubscriptionsService,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}"""

if new_constructor_block not in service:
    if old_constructor_block not in service:
        raise SystemExit("Could not find ProjectsService constructor injection block.")
    service = service.replace(old_constructor_block, new_constructor_block, 1)

# 3) Enforce project limit before project.save()
old_create_anchor = """    this.logger.log(`Creating project for user ${userId}: ${dto.name}`);

    const emoji = (dto.emoji || dto.icon || '📁').trim();"""

new_create_anchor = """    this.logger.log(`Creating project for user ${userId}: ${dto.name}`);

    const projectUsageCheck = await this.subscriptionsService.checkLimit(userId, 'projects');

    if (!projectUsageCheck.allowed) {
      const planLimit = projectUsageCheck.limit === -1 ? 'unlimited' : projectUsageCheck.limit;

      throw new ForbiddenException(
        `Project limit reached. Your current plan allows ${planLimit} active projects. Complete, archive, or upgrade to create more projects.`,
      );
    }

    const emoji = (dto.emoji || dto.icon || '📁').trim();"""

if new_create_anchor not in service:
    if old_create_anchor not in service:
        raise SystemExit("Could not find project creation logger/emoji anchor.")
    service = service.replace(old_create_anchor, new_create_anchor, 1)

service_path.write_text(service)

# 4) Import SubscriptionsModule into ProjectsModule
module_import = "import { SubscriptionsModule } from '../subscriptions/subscriptions.module';\n"
module_import_anchor = "import { NotificationsModule } from '../notifications/notifications.module';\n"

if module_import not in module:
    if module_import_anchor not in module:
        raise SystemExit("Could not find NotificationsModule import anchor in projects.module.ts.")
    module = module.replace(module_import_anchor, module_import_anchor + module_import, 1)

# 5) Add SubscriptionsModule to imports using forwardRef for safety
old_module_imports = """    ProjectFollowModule,
    ModerationModule,
    forwardRef(() => RealtimeModule),
    forwardRef(() => NotificationsModule)
  ],"""

new_module_imports = """    ProjectFollowModule,
    ModerationModule,
    forwardRef(() => RealtimeModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => SubscriptionsModule)
  ],"""

if "forwardRef(() => SubscriptionsModule)" not in module:
    if old_module_imports not in module:
        raise SystemExit("Could not find ProjectsModule imports block.")
    module = module.replace(old_module_imports, new_module_imports, 1)

module_path.write_text(module)

print("✅ ProjectsService now enforces subscription project limits before creation.")
print("✅ ProjectsModule now imports SubscriptionsModule.")
