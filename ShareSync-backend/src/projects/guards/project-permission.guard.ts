// src/projects/guards/project-permission.guard.ts
import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    SetMetadata,
    Inject,
    forwardRef,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { ProjectsService } from '../project.service';
  
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
      if (!perm) return true; // no permission required
  
      const req = ctx.switchToHttp().getRequest();
      const userId: string | undefined = req?.user?.sub || req?.user?.id || req?.user?._id;
      const projectId: string | undefined = req?.params?.projectId || req?.params?.id;
  
      if (!userId) throw new ForbiddenException('Not authenticated');
      if (!projectId) throw new BadRequestException('Missing project id');
  
      // member-aware lookup (owner OR listed member)
      const project = await this.projects.findOneForUser(userId, projectId);
      if (!project) throw new ForbiddenException('No access to this project');
  
      // resolve role (owner, member.role, or viewer if present)
      let role: 'owner' | 'member' | 'viewer' | null = null;
      if (String(project.userId) === String(userId)) role = 'owner';
      else if (Array.isArray(project.members)) {
        const me = project.members.find((m: any) => String(m.userId) === String(userId));
        role = (me?.role as any) ?? null;
      }
  
      if (!roleAllows(role, perm)) {
        throw new ForbiddenException('Insufficient permissions');
      }
  
      // expose project + role downstream (optional)
      req.project = project;
      req.projectRole = role;
  
      return true;
    }
  }  