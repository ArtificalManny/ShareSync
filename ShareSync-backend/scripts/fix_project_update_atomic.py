from pathlib import Path
import re
import shutil
from datetime import datetime

path = Path("src/projects/projects.service.ts")

if not path.exists():
    raise SystemExit("❌ Could not find src/projects/projects.service.ts")

timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".bak-before-atomic-project-update-{timestamp}")
shutil.copy2(path, backup)
print(f"✅ Backup created: {backup}")

text = path.read_text()

pattern = re.compile(
    r"""  async update\(projectId: string, userId: string, dto: UpdateProjectDto\): Promise<ProjectDocument> \{
.*?
  \}

  async updateMetrics""",
    re.DOTALL,
)

replacement = r'''  async update(projectId: string, userId: string, dto: UpdateProjectDto): Promise<ProjectDocument> {
    const project = await this.findByIdWithAccess(projectId, userId);

    if (!this.canEdit(project, userId)) {
      throw new ForbiddenException('You do not have permission to edit this project');
    }

    const patch: Record<string, any> = {};
    const now = new Date();

    if (typeof dto.name === 'string') {
      patch.name = dto.name.trim();
    }

    if (typeof (dto as any).title === 'string' && !patch.name) {
      patch.name = String((dto as any).title).trim();
    }

    if (typeof dto.description === 'string') {
      patch.description = dto.description.trim();
    }

    if (typeof (dto as any).icon === 'string') {
      patch.icon = String((dto as any).icon).trim() || '📁';
    }

    if (typeof (dto as any).emoji === 'string') {
      patch.emoji = String((dto as any).emoji).trim() || patch.icon || '📁';
    }

    if (typeof (dto as any).color === 'string') {
      patch.color = String((dto as any).color).trim();
    }

    if (Array.isArray((dto as any).tags)) {
      patch.tags = (dto as any).tags;
    }

    if (typeof (dto as any).category === 'string') {
      patch.category = String((dto as any).category).trim();
    }

    if (typeof (dto as any).logoUrl === 'string' && String((dto as any).logoUrl).trim()) {
      patch.logoUrl = String((dto as any).logoUrl).trim();
    }

    if (typeof (dto as any).bannerUrl === 'string' && String((dto as any).bannerUrl).trim()) {
      patch.bannerUrl = String((dto as any).bannerUrl).trim();
    }

    if (typeof (dto as any).isStarred === 'boolean') {
      patch.isStarred = (dto as any).isStarred;
    }

    if (typeof (dto as any).isArchived === 'boolean') {
      patch.isArchived = (dto as any).isArchived;
    }

    if (dto.status) {
      const normalizedStatus = this.normalizeStatus(dto.status as any);
      patch.status = normalizedStatus;

      if (normalizedStatus === ProjectStatus.ARCHIVED) {
        patch.archivedAt = now;
        patch.isArchived = true;
      } else if (normalizedStatus === ProjectStatus.COMPLETED) {
        patch.completedAt = now;
      } else {
        patch.isArchived = false;
      }
    }

    if ((dto as any).settings && typeof (dto as any).settings === 'object' && !Array.isArray((dto as any).settings)) {
      const existingSettings = (project as any).settings || {};
      patch.settings = {
        ...existingSettings,
        ...(dto as any).settings,
      };
    }

    patch.updatedAt = now;

    const updated = await this.projectModel
      .findByIdAndUpdate(
        projectId,
        { $set: patch },
        {
          new: true,
          runValidators: false,
        },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Project not found');
    }

    this.eventEmitter.emit('project.updated', {
      projectId: updated._id,
      userId,
      changes: patch,
    });

    return updated;
  }

  async updateMetrics'''

updated, count = pattern.subn(replacement, text, count=1)

if count != 1:
    raise SystemExit("❌ Could not replace ProjectsService.update(). No changes written.")

path.write_text(updated)

print("✅ ProjectsService.update() replaced with atomic $set update.")
print("✅ This avoids full-document project.save() validation failures.")
print("")
print("Inspect:")
print("sed -n '560,660p' src/projects/projects.service.ts")
print("")
print("Then run:")
print("npm run build")
