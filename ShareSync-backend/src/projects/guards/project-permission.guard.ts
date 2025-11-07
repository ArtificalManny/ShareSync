// backend/src/projects/guards/project-permission.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectsService } from '../project.service';

const ROLE_KEY = 'role';

// Decorators
export const CanEditProject = () => SetMetadata(ROLE_KEY, 'owner');
export const CanViewProject = () => SetMetadata(ROLE_KEY, 'viewer');
export const CanManageProject = () => SetMetadata(ROLE_KEY, 'owner');

@Injectable()
export class ProjectPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRole = this.reflector.get<string>(ROLE_KEY, context.getHandler());
    if (!requiredRole) return true; // No role required

    const request = context.switchToHttp().getRequest();
    const projectId =
      request.body?.projectId || request.params?.id || request.query?.projectId;
    const userId = request.user?.sub || request.user?._id;

    if (!projectId || !userId) return false;

    const project = await this.projectsService.findOneForUser(userId, projectId);
    if (!project) return false;

    const member = project.members?.find((m: any) => String(m.userId) === String(userId));
    if (!member) return false;

    const hasOwner = member.role === 'owner';
    const hasRequired = member.role === requiredRole || hasOwner;

    return hasRequired;
  }
}