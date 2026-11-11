import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import {
  OBJECT_ID,
  PROJECT_STANDING_FIELDS,
  actorIdOf,
  idText,
  isProjectManager,
} from '../common/guards/project-standing';

// openshare-integrations-access-v1 (R52)
//
// Integrations (GitHub, Slack and the rest) belong either to a project or to the
// person who connected them. Only these may see or use one:
//   - a project's integration: the project owner, or a member whose role is
//     owner or admin;
//   - a personal integration (no project): the person who connected it.
// Connecting one to a project (POST /integrations with a body projectId, or the
// OAuth start with ?projectId=) needs the same owner or admin standing. The
// OAuth callback and the incoming webhooks are not covered here; they don't act
// for a signed-in user. Runs after JwtAuthGuard. A database error refuses the
// request.

export const INTEGRATIONS_REFUSAL = 'Not authorized for this integration';

const PROJECT_PROJECTION = Object.fromEntries(
  PROJECT_STANDING_FIELDS.split(' ').map((field) => [field, 1]),
);

@Injectable()
export class IntegrationsAccessGuard implements CanActivate {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  private async findOne(collection: string, id: string, projection: Record<string, number>): Promise<any> {
    try {
      return await this.connection
        .collection(collection)
        .findOne({ _id: new Types.ObjectId(id) }, { projection });
    } catch {
      throw new ServiceUnavailableException('Integration authorization unavailable');
    }
  }

  private async requireManager(projectId: unknown, userId: string): Promise<true> {
    if (typeof projectId !== 'string' || !OBJECT_ID.test(projectId)) {
      throw new ForbiddenException(INTEGRATIONS_REFUSAL);
    }
    const project = await this.findOne('projects', projectId, PROJECT_PROJECTION);
    if (!isProjectManager(project, userId)) {
      throw new ForbiddenException(INTEGRATIONS_REFUSAL);
    }
    return true;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = actorIdOf(request?.user);
    if (!userId) {
      throw new ForbiddenException(INTEGRATIONS_REFUSAL);
    }
    const params = request?.params || {};

    if (params.id !== undefined) {
      if (typeof params.id !== 'string' || !OBJECT_ID.test(params.id)) {
        throw new BadRequestException('Invalid integration ID');
      }
      const integration = await this.findOne('integrations', params.id, { projectId: 1, userId: 1 });
      if (!integration) {
        throw new NotFoundException('Integration not found');
      }
      const projectId = idText(integration.projectId);
      if (projectId) return this.requireManager(projectId, userId);
      if (idText(integration.userId) === userId) return true;
      throw new ForbiddenException(INTEGRATIONS_REFUSAL);
    }

    if (params.projectId !== undefined) {
      return this.requireManager(params.projectId, userId);
    }

    // A new integration: for a project only its owner or an admin; without a
    // project it is the caller's own. Every project the request names, in the
    // body or the query, must be one the caller manages.
    const named = [request?.body?.projectId, request?.query?.projectId].filter(
      (value) => value !== undefined && value !== null && value !== '',
    );
    for (const projectId of named) {
      await this.requireManager(projectId, userId);
    }
    return true;
  }
}
