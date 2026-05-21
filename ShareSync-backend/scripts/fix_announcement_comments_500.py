from pathlib import Path
from datetime import datetime
import re

controller_path = Path("src/announcements/announcements.controller.ts")
service_path = Path("src/announcements/announcements.service.ts")

for path in [controller_path, service_path]:
    text = path.read_text()
    backup = path.with_suffix(
        path.suffix + f".bak-before-announcement-comment-500-fix-v2-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    backup.write_text(text)
    print(f"✅ Backup created: {backup}")

controller = controller_path.read_text()

controller_pattern = re.compile(
    r"""@Post\(':id/comments'\)\s*
\s*async addComment\([\s\S]*?\n\s*\}\n\s*(?=@Delete\(':id/comments/:commentId'\))""",
    re.MULTILINE,
)

controller_replacement = """@Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: any = {},
  ) {
    const isMongoId = (value: any) =>
      typeof value === 'string' && /^[a-f\\d]{24}$/i.test(value);

    const userCandidates = [
      req?.user?.userId,
      req?.user?.id,
      req?.user?._id,
      req?.user?.sub,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean);

    const userId =
      userCandidates.find(isMongoId) ||
      userCandidates[0] ||
      '';

    const text = String(
      body?.text ??
      body?.content ??
      body?.message ??
      body?.comment ??
      ''
    ).trim();

    const attachments = Array.isArray(body?.attachments) ? body.attachments : [];

    return this.announcementsService.addComment(id, userId, text, attachments);
  }

  """

controller, controller_count = controller_pattern.subn(
    lambda _: controller_replacement,
    controller,
    count=1,
)

if controller_count != 1:
    raise SystemExit("❌ Could not replace addComment() in announcements.controller.ts")

controller_path.write_text(controller)
print("✅ Controller addComment() replaced.")


service = service_path.read_text()

service_pattern = re.compile(
    r"""public async addComment\([\s\S]*?\n\s*\}\n\s*(?=public async deleteComment\()""",
    re.MULTILINE,
)

service_replacement = """public async addComment(
    announcementId: string,
    userId: string,
    text: string,
    attachments: any[] = [],
  ) {
    const annId = this.toObjectId(announcementId, 'announcementId');

    const actorId = this.normalizeId(userId);
    if (!actorId) {
      throw new BadRequestException('User is required to comment');
    }

    const cleanText = String(text ?? '').trim();
    if (!cleanText) {
      throw new BadRequestException('Comment text is required');
    }

    const existing = await this.announcementModel.findById(annId).exec();

    if (!existing) {
      throw new NotFoundException('Announcement not found');
    }

    const nextComment = {
      _id: new Types.ObjectId(),
      userId: actorId,
      authorId: actorId,
      text: cleanText,
      content: cleanText,
      message: cleanText,
      attachments: Array.isArray(attachments) ? attachments : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updated = await this.announcementModel
      .findByIdAndUpdate(
        annId,
        {
          $push: { comments: nextComment },
        },
        {
          new: true,
          runValidators: false,
        },
      )
      .populate('authorId', this.userPopulateFields)
      .exec();

    if (!updated) {
      throw new NotFoundException('Announcement not found');
    }

    return updated;
  }

  """

service, service_count = service_pattern.subn(
    lambda _: service_replacement,
    service,
    count=1,
)

if service_count != 1:
    raise SystemExit("❌ Could not replace addComment() in announcements.service.ts")

service_path.write_text(service)
print("✅ Service addComment() replaced.")

print("")
print("Inspect:")
print("sed -n '95,130p' src/announcements/announcements.controller.ts")
print("sed -n '315,380p' src/announcements/announcements.service.ts")
print("")
print("Then run:")
print("npm run build")
