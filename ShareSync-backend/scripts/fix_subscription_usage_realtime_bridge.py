from pathlib import Path
import re
from datetime import datetime

CONTROLLER = Path("src/subscriptions/subscriptions.controller.ts")
SERVICE = Path("src/subscriptions/subscriptions.service.ts")
MODULE = Path("src/subscriptions/subscriptions.module.ts")

def backup(path: Path):
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = path.with_suffix(path.suffix + f".bak.subscription-usage-realtime-{stamp}")
    backup_path.write_text(path.read_text())
    print(f"[backup] {backup_path}")

def require_once(text: str, needle: str, label: str):
    count = text.count(needle)
    if count != 1:
        raise SystemExit(f"[ERROR] {label}: expected 1 occurrence, found {count}")

def patch_service():
    text = SERVICE.read_text()
    backup(SERVICE)

    old = """  async incrementUsage(
    userId: string,
    resource: 'projects' | 'storage' | 'aiCalls',
    amount = 1,
  ): Promise<void> {
    const updateField = resource === 'aiCalls' ? 'usage.aiCallsThisMonth' : `usage.${resource}`;

    await this.subscriptionModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      {
        $inc: { [updateField]: amount },
        ...(resource === 'aiCalls' && { $inc: { 'usage.aiCalls': amount } }),
      },
    );
  }

"""

    new = """  async incrementUsage(
    userId: string,
    resource: 'projects' | 'storage' | 'aiCalls',
    amount = 1,
  ): Promise<void> {
    await this.getOrCreateSubscription(userId);

    const safeAmount = Number.isFinite(amount) ? amount : 1;
    const inc: Record<string, number> = {};

    if (resource === 'aiCalls') {
      inc['usage.aiCallsThisMonth'] = safeAmount;
      inc['usage.aiCalls'] = safeAmount;
    } else {
      inc[`usage.${resource}`] = safeAmount;
    }

    await this.subscriptionModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      { $inc: inc },
    );
  }

"""

    require_once(text, old, "old incrementUsage block")
    text = text.replace(old, new)

    SERVICE.write_text(text)
    print("[patched] subscriptions.service.ts incrementUsage")

def patch_module():
    text = MODULE.read_text()
    backup(MODULE)

    if "vault/schemas/vault-file.schema" not in text:
        text = text.replace(
            "import { Project, ProjectSchema } from '../projects/schemas/project.schema';",
            "import { Project, ProjectSchema } from '../projects/schemas/project.schema';\nimport { VaultFile, VaultFileSchema } from '../vault/schemas/vault-file.schema';"
        )

    if "{ name: VaultFile.name, schema: VaultFileSchema }" not in text:
        text = text.replace(
            "      { name: Project.name, schema: ProjectSchema },",
            "      { name: Project.name, schema: ProjectSchema },\n      { name: VaultFile.name, schema: VaultFileSchema },"
        )

    MODULE.write_text(text)
    print("[patched] subscriptions.module.ts VaultFile model registration")

def patch_controller():
    text = CONTROLLER.read_text()
    backup(CONTROLLER)

    if "vault/schemas/vault-file.schema" not in text:
        text = text.replace(
            "import { SubscriptionsService, PLAN_CONFIGS } from './subscriptions.service';",
            "import { SubscriptionsService, PLAN_CONFIGS } from './subscriptions.service';\nimport { VaultFile } from '../vault/schemas/vault-file.schema';"
        )

    old_constructor = """  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    @InjectModel('Project') private readonly projectModel: Model<any>,
  ) {}"""

    new_constructor = """  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    @InjectModel('Project') private readonly projectModel: Model<any>,
    @InjectModel(VaultFile.name) private readonly vaultFileModel: Model<any>,
  ) {}"""

    if old_constructor in text:
        text = text.replace(old_constructor, new_constructor)
    elif "vaultFileModel" not in text:
        raise SystemExit("[ERROR] Could not safely patch constructor")

    old_usage_line = "        usage: { ...JSON.parse(JSON.stringify(subscription.usage || {})), projects: realProjectCount },"
    require_once(text, old_usage_line, "old usage response line")

    old_project_block = """    // Get real project count instead of subscription doc's stale value
    const oid = new Types.ObjectId(userId);
    const realProjectCount = await this.projectModel.countDocuments({
      $or: [
        { ownerId: oid },
        { owner: oid },
        { 'members.userId': oid },
      ],
      isArchived: { $ne: true },
    });

"""

    new_project_block = """    // SUBSCRIPTION USAGE REALTIME BRIDGE
    // Projects and storage are derived from live records so the Navbar usage pill
    // does not depend on stale subscription.usage snapshots.
    const oid = new Types.ObjectId(userId);
    const projectAccessQuery = {
      $or: [
        { ownerId: oid },
        { owner: oid },
        { 'members.userId': oid },
      ],
      isArchived: { $ne: true },
    };

    const realProjectIds = await this.projectModel.distinct('_id', projectAccessQuery);
    const realProjectCount = realProjectIds.length;

    const storageRows = realProjectIds.length
      ? await this.vaultFileModel.aggregate([
          { $match: { projectId: { $in: realProjectIds } } },
          {
            $group: {
              _id: null,
              totalBytes: {
                $sum: {
                  $ifNull: ['$sizeInBytes', { $ifNull: ['$size', 0] }],
                },
              },
            },
          },
        ])
      : [];

    const realStorageBytes = storageRows?.[0]?.totalBytes || 0;
    const baseUsage = JSON.parse(JSON.stringify(subscription.usage || {}));

"""

    require_once(text, old_project_block, "old project count block")
    text = text.replace(old_project_block, new_project_block)

    new_usage_line = """        usage: {
          ...baseUsage,
          projects: realProjectCount,
          storage: realStorageBytes,
          aiCalls: baseUsage.aiCalls || 0,
          aiCallsThisMonth: baseUsage.aiCallsThisMonth || 0,
        },"""

    text = text.replace(old_usage_line, new_usage_line)

    CONTROLLER.write_text(text)
    print("[patched] subscriptions.controller.ts live project/storage usage")

def main():
    print("[fix_subscription_usage_realtime_bridge] starting")
    patch_service()
    patch_module()
    patch_controller()
    print()
    print("[fix_subscription_usage_realtime_bridge] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "SUBSCRIPTION USAGE REALTIME BRIDGE|vaultFileModel|VaultFile|realStorageBytes|baseUsage|incrementUsage|usage.aiCallsThisMonth|usage.aiCalls" src/subscriptions -C 6')
    print("  git diff -- src/subscriptions/subscriptions.service.ts src/subscriptions/subscriptions.controller.ts src/subscriptions/subscriptions.module.ts")

if __name__ == "__main__":
    main()
