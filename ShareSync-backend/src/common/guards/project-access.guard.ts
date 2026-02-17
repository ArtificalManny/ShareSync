// src/common/guards/project-access.guard.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT ACCESS GUARD (3.6)
// - Enforces project access consistently across controllers
// - Supports:
//    • private/team → members only
//    • public → read allowed for non-members (when allowPublicRead=true)
//    • write always members (and optionally role-restricted)
//
// Usage example:
//   @ProjectAccess({ param: 'projectId', intent: 'read', allowPublicRead: true })
//   @UseGuards(JwtAuthGuard, ProjectAccessGuard)
//
//   @ProjectAccess({ param: 'projectId', intent: 'write', roles: ['owner','admin','member'] })
//   @UseGuards(JwtAuthGuard, ProjectAccessGuard)
// ═══════════════════════════════════════════════════════════════════════════════

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

export type ProjectAccessOptions = {
  /**
   * Route param name that contains the projectId.
   * Default: "projectId"
   */
  param?: string;

  /**
   * Access intent for this route.
   * - read: allow non-member access ONLY if project is public and allowPublicRead=true
   * - write: always requires membership (and optionally roles)
   */
  intent?: 'read' | 'write';

  /**
   * If true and intent="read":
   * - public projects are readable by non-members
   * - private/team still require membership
   */
  allowPublicRead?: boolean;

  /**
   * Allowed roles in the project membership object (if your project stores roles).
   * If omitted, any membership passes (for write) or membership passes (for private read).
   */
  roles?: string[];
};

export const PROJECT_ACCESS_KEY = 'project_access_options';

export const ProjectAccess = (options: ProjectAccessOptions = {}) =>
  SetMetadata(PROJECT_ACCESS_KEY, options);

type MinimalProjectDoc = {
  _id: Types.ObjectId;

  // Visibility (for public read rules)
  visibility?: string; // 'private' | 'team' | 'public' (matches your enum values)

  ownerId?: Types.ObjectId;
  owner?: Types.ObjectId | null;

  createdBy?: Types.ObjectId;

  members?: Array<{
    userId: Types.ObjectId;
    user?: Types.ObjectId;
    role?: string;
  }>;
};

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    // We intentionally inject the model by string name to avoid importing your Project class.
    @InjectModel('Project') private readonly projectModel: Model<MinimalProjectDoc>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options =
      this.reflector.get<ProjectAccessOptions>(PROJECT_ACCESS_KEY, context.getHandler()) ||
      this.reflector.get<ProjectAccessOptions>(PROJECT_ACCESS_KEY, context.getClass()) ||
      {};

    const req = context.switchToHttp().getRequest<any>();

    // Be compatible with multiple JWT payload shapes
    const userId: string | undefined =
      req?.user?.sub || req?.user?.userId || req?.user?.id;

    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }

    const paramName = options.param || 'projectId';
    const projectId =
      req?.params?.[paramName] || req?.body?.[paramName] || req?.query?.[paramName];

    if (!projectId || typeof projectId !== 'string') {
      throw new ForbiddenException(`Missing projectId (${paramName})`);
    }

    if (!Types.ObjectId.isValid(projectId)) {
      throw new ForbiddenException(`Invalid projectId (${paramName})`);
    }

    const project = await this.projectModel.findById(projectId).lean();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const intent: 'read' | 'write' = options.intent || 'read';
    const allowPublicRead = Boolean(options.allowPublicRead);

    // 3.6 RULE:
    // - public project + intent=read + allowPublicRead=true => allow even if not member
    // - otherwise: membership required
    if (intent === 'read' && allowPublicRead) {
      const vis = String(project.visibility || '').toLowerCase();
      if (vis === 'public') {
        req.project = project;
        req.projectAccess = { intent, allowedBy: 'public_read' };
        return true;
      }
    }

    const ok = this.hasAccess(project, userId, options.roles);
    if (!ok) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Attach for downstream use
    req.project = project;
    req.projectAccess = { intent, allowedBy: 'member' };

    return true;
  }

  private hasAccess(project: MinimalProjectDoc, userId: string, roles?: string[]): boolean {
    const userObjectId = new Types.ObjectId(userId);

    // Owner checks (common patterns)
    if (project.ownerId && project.ownerId.toString() === userObjectId.toString()) return true;
    if (project.owner && project.owner.toString() === userObjectId.toString()) return true;
    if (project.createdBy && project.createdBy.toString() === userObjectId.toString()) return true;

    // Membership checks (support both members.userId and members.user)
    const members = project.members || [];
    const membership = members.find((m) => {
      const uid = m.userId || m.user;
      return uid?.toString?.() === userObjectId.toString();
    });

    if (!membership) return false;

    // If roles list provided, enforce it (otherwise any member is ok)
    if (roles && roles.length > 0) {
      const role = membership.role || 'member';
      return roles.includes(role);
    }

    return true;
  }
}
