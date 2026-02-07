import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectsService } from '../projects.service';

export type ProjectPermission = 'view' | 'edit' | 'manage';
const PERM_KEY = 'project:permission';

export const RequireProjectPermission = (perm: ProjectPermission) =>
  SetMetadata(PERM_KEY, perm);

// Convenience decorators
export const CanViewProject = () => RequireProjectPermission('view');
export const CanEditProject = () => RequireProjectPermission('edit');
export const CanManageProject = () => RequireProjectPermission('manage');

function roleAllows(
  role: 'owner' | 'member' | 'viewer' | null,
  needed: ProjectPermission,
): boolean {
  if (!role) return false;
  if (needed === 'view') return role === 'owner' || role === 'member' || role === 'viewer';
  if (needed === 'edit') return role === 'owner' || role === 'member';
  if (needed === 'manage') return role === 'owner';
  return false;
}

@Injectable()
export class ProjectPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projects: ProjectsService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const perm = this.reflector.getAllAndOverride<ProjectPermission>(PERM_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!perm) return true;

    const req = ctx.switchToHttp().getRequest();

    const userId: string | undefined =
      req?.user?.sub || req?.user?.userId || req?.user?.id || req?.user?._id;

    const projectId: string | undefined =
      req?.params?.projectId ||
      req?.params?.id ||
      (typeof req?.body?.projectId === 'string' ? req.body.projectId : undefined) ||
      (typeof req?.query?.projectId === 'string' ? req.query.projectId : undefined);

    if (!projectId) return true;
    if (!userId) throw new ForbiddenException('Not authenticated');

    // ✅ ProjectsService compatibility method (we add this below)
    const project = await this.projects.findOneForUser(userId, projectId);
    if (!project) throw new ForbiddenException('No access to this project');

    // ✅ FIX: owner field is ownerId (or legacy owner), not userId
    let role: 'owner' | 'member' | 'viewer' | null = null;

    const ownerId = (project as any).ownerId?.toString?.() || null;
    const owner = (project as any).owner?.toString?.() || null;

    if (String(ownerId) === String(userId) || String(owner) === String(userId)) {
      role = 'owner';
    } else if (Array.isArray((project as any).members)) {
      const me = (project as any).members.find(
        (m: any) => String(m?.userId || m?.user) === String(userId),
      );

      // Normalize role into owner/member/viewer for this guard
      const rawRole = (me?.role as any) ?? null;

      if (!rawRole) role = null;
      else if (rawRole === 'owner' || rawRole === 'OWNER') role = 'owner';
      else if (rawRole === 'admin' || rawRole === 'ADMIN') role = 'member';
      else if (rawRole === 'member' || rawRole === 'MEMBER') role = 'member';
      else if (rawRole === 'viewer' || rawRole === 'VIEWER') role = 'viewer';
      else role = null;
    }

    if (!roleAllows(role, perm)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    req.project = project;
    req.projectRole = role;

    return true;
  }
}
