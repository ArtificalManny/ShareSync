// src/common/guards/project-access.guard.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT ACCESS GUARD
// - Enforces that the requesting user is a member/owner of a project
// - Safe to add: does nothing unless you apply @UseGuards(ProjectAccessGuard)
// - Uses metadata from @ProjectAccess() decorator (below)
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
   * Allowed roles in the project membership object (if your project stores roles).
   * If omitted, any membership passes.
   */
  roles?: string[];
};

export const PROJECT_ACCESS_KEY = 'project_access_options';

/**
 * Usage example:
 *   @ProjectAccess({ param: 'projectId', roles: ['owner', 'admin', 'member'] })
 *   @UseGuards(JwtAuthGuard, ProjectAccessGuard)
 */
export const ProjectAccess = (options: ProjectAccessOptions = {}) =>
  SetMetadata(PROJECT_ACCESS_KEY, options);

type MinimalProjectDoc = {
  _id: Types.ObjectId;
  ownerId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  members?: Array<{
    userId: Types.ObjectId;
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
    const userId: string | undefined = req?.user?.userId;

    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }

    const paramName = options.param || 'projectId';
    const projectId = req?.params?.[paramName] || req?.body?.[paramName] || req?.query?.[paramName];

    if (!projectId || typeof projectId !== 'string') {
      throw new ForbiddenException(`Missing projectId (${paramName})`);
    }

    const project = await this.projectModel.findById(projectId).lean();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const ok = this.hasAccess(project, userId, options.roles);
    if (!ok) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Optionally attach project to request for downstream use
    req.project = project;

    return true;
  }

  private hasAccess(project: MinimalProjectDoc, userId: string, roles?: string[]): boolean {
    const userObjectId = new Types.ObjectId(userId);

    // Owner checks (common patterns)
    if (project.ownerId && project.ownerId.toString() === userObjectId.toString()) return true;
    if (project.createdBy && project.createdBy.toString() === userObjectId.toString()) return true;

    // Membership checks
    const members = project.members || [];
    const membership = members.find((m) => m.userId?.toString() === userObjectId.toString());
    if (!membership) return false;

    // If roles list provided, enforce it (otherwise any member is ok)
    if (roles && roles.length > 0) {
      const role = membership.role || 'member';
      return roles.includes(role);
    }

    return true;
  }
}
