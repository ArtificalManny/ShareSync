from pathlib import Path
import re

schema_path = Path("src/projects/schemas/project.schema.ts")
service_path = Path("src/projects/invites.service.ts")
controller_path = Path("src/projects/invites.controller.ts")

for path in [schema_path, service_path, controller_path]:
    if not path.exists():
        raise SystemExit(f"Missing file: {path}")

schema = schema_path.read_text()
service = service_path.read_text()
controller = controller_path.read_text()

# ─────────────────────────────────────────────────────────────
# 1. Allow declined in embedded ProjectInvite status union
# ─────────────────────────────────────────────────────────────

old_union = "status: InviteStatus | 'pending' | 'accepted' | 'revoked' | 'expired';"
new_union = "status: InviteStatus | 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';"

if old_union in schema:
    schema = schema.replace(old_union, new_union, 1)

# Add declinedByUserId / respondedAt if the embedded schema does not already expose them.
if "declinedByUserId" not in schema:
    accepted_anchor = """  @Prop({ type: Types.ObjectId, ref: 'User' })
  acceptedByUserId?: Types.ObjectId;"""

    declined_fields = """  @Prop({ type: Types.ObjectId, ref: 'User' })
  acceptedByUserId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  declinedByUserId?: Types.ObjectId;"""

    if accepted_anchor in schema:
        schema = schema.replace(accepted_anchor, declined_fields, 1)
    else:
        print("WARNING: Could not find acceptedByUserId anchor in project.schema.ts. Skipped declinedByUserId field.")

if "respondedAt?: Date" not in schema:
    expires_anchor = """  @Prop({ type: Date })
  expiresAt?: Date;"""

    responded_field = """  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: Date })
  respondedAt?: Date;"""

    if expires_anchor in schema:
        schema = schema.replace(expires_anchor, responded_field, 1)
    else:
        print("WARNING: Could not find expiresAt anchor in project.schema.ts. Skipped respondedAt field.")

schema_path.write_text(schema)

# ─────────────────────────────────────────────────────────────
# 2. Add InvitesService.declineInvite()
# ─────────────────────────────────────────────────────────────

if "async declineInvite(" not in service:
    decline_method = """
  async declineInvite(token: string, userId: string, userEmail?: string) {
    if (!token) throw new BadRequestException('token is required');

    const query: FilterQuery<ProjectDocument> = { 'invites.token': token };
    const project = await this.projectModel.findOne(query);
    if (!project) throw new NotFoundException('Invite not found');

    const invite = (project.invites || []).find((i) => i.token === token);
    if (!invite) throw new NotFoundException('Invite not found');

    if (invite.status !== 'pending') {
      throw new BadRequestException(`Invite is ${invite.status} and cannot be declined.`);
    }

    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      invite.status = 'expired';
      await project.save();
      throw new BadRequestException('Invite has expired.');
    }

    const inviteEmail = String((invite as any).email || '').trim().toLowerCase();
    const accountEmail = String(userEmail || '').trim().toLowerCase();

    if (inviteEmail && !accountEmail) {
      throw new ForbiddenException('You must be logged in as the invited email address to decline this invite.');
    }

    if (inviteEmail && accountEmail && inviteEmail !== accountEmail) {
      throw new ForbiddenException('This invite was sent to a different email address.');
    }

    invite.status = 'declined' as any;
    (invite as any).declinedByUserId = new Types.ObjectId(userId);
    (invite as any).respondedAt = new Date();

    await project.save();

    this.realtime.emitToProject(project.id, 'project:membersUpdated', {
      projectId: project.id,
      members: project.members,
      invites: project.invites,
    });

    this.eventEmitter.emit('project.invite.declined', {
      projectId: project.id,
      projectName: project.name,
      declinedBy: userId,
      role: invite.role,
      ownerId: this.getId(project.ownerId || project.owner),
    });

    this.logger.log(`Invite declined by user ${userId} for project ${project.name}`);

    return {
      projectId: project.id,
      members: project.members,
      invites: project.invites,
    };
  }

"""

    anchor = "  async revokeInvite("
    if anchor not in service:
        raise SystemExit("Could not find revokeInvite anchor in invites.service.ts.")

    service = service.replace(anchor, decline_method + anchor, 1)

service_path.write_text(service)

# ─────────────────────────────────────────────────────────────
# 3. Add POST /invites/decline to GlobalInvitesController
# ─────────────────────────────────────────────────────────────

if "@Post('decline')" not in controller:
    accept_block = """    /** POST /invites/accept  body: { token } */
    @Post('accept')
    async accept(@Body() body: { token: string }, @Req() req: any) {
      const userId = req.user?.sub || req.user?.userId || req.user?.id || req.user?._id;
      const email = req.user?.email;
      return this.invites.acceptInvite(body?.token, userId, email);
    }"""

    accept_plus_decline = """    /** POST /invites/accept  body: { token } */
    @Post('accept')
    async accept(@Body() body: { token: string }, @Req() req: any) {
      const userId = req.user?.sub || req.user?.userId || req.user?.id || req.user?._id;
      const email = req.user?.email;
      return this.invites.acceptInvite(body?.token, userId, email);
    }

    /** POST /invites/decline  body: { token } */
    @Post('decline')
    async decline(@Body() body: { token: string }, @Req() req: any) {
      const userId = req.user?.sub || req.user?.userId || req.user?.id || req.user?._id;
      const email = req.user?.email;
      return this.invites.declineInvite(body?.token, userId, email);
    }"""

    if accept_block not in controller:
        raise SystemExit("Could not find accept endpoint block in invites.controller.ts.")

    controller = controller.replace(accept_block, accept_plus_decline, 1)

controller_path.write_text(controller)

print("Added invite decline endpoint and embedded invite declined status support.")
