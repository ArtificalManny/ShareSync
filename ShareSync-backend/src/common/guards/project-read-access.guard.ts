import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import {
  OBJECT_ID,
  PROJECT_STANDING_FIELDS,
  actorIdOf,
  idText,
  projectStanding,
} from './project-standing';

// openshare-project-read-access-v1 (R52)
//
// Lets a request read a project's data only when the signed-in user may read the
// project itself: the owner, any member, or, for a public or listed project that
// isn't archived, a spectator. It is the same rule the project page, Moves and
// announcements use (project-standing.ts). Runs after JwtAuthGuard.
//
// Each route says where its project ID comes from with @ProjectReadAccess():
//   - param (the default, 'projectId'): a route parameter;
//   - query or body: a query or body field;
//   - entity: a record that belongs to a project, found by a route parameter
//     (a milestone by its ID, say); that record's projectId decides.
// optional: true lets a request through when it names no project at all; the
// route then answers without any project's data.
//
// IDs that aren't ObjectIds are refused before any database query, and a database
// error refuses the request: an outage never becomes access. A record that doesn't
// exist is left to the route, which answers as it did before.

export type ProjectReadAccessOptions = {
  param?: string;
  query?: string;
  body?: string;
  entity?: { collection: string; param: string };
  optional?: boolean;
};

export const PROJECT_READ_ACCESS = 'openshare:project-read-access';

export const ProjectReadAccess = (options: ProjectReadAccessOptions) =>
  SetMetadata(PROJECT_READ_ACCESS, options);

export const PROJECT_READ_REFUSAL = 'Not authorized for this project';

const PROJECT_PROJECTION = Object.fromEntries(
  PROJECT_STANDING_FIELDS.split(' ').map((field) => [field, 1]),
);

@Injectable()
export class ProjectReadAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private async findOne(collection: string, id: string, projection: Record<string, number>): Promise<any> {
    try {
      return await this.connection
        .collection(collection)
        .findOne({ _id: new Types.ObjectId(id) }, { projection });
    } catch {
      throw new ServiceUnavailableException('Project authorization unavailable');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options: ProjectReadAccessOptions =
      this.reflector.getAllAndOverride<ProjectReadAccessOptions>(PROJECT_READ_ACCESS, [
        context.getHandler(),
        context.getClass(),
      ]) ?? {};
    const request = context.switchToHttp().getRequest();

    let raw: unknown;
    if (options.entity) raw = request?.params?.[options.entity.param];
    else if (options.query) raw = request?.query?.[options.query];
    else if (options.body) raw = request?.body?.[options.body];
    else raw = request?.params?.[options.param ?? 'projectId'];

    if (raw === undefined || raw === null || raw === '') {
      if (options.optional === true) return true;
      throw new ForbiddenException(PROJECT_READ_REFUSAL);
    }
    if (typeof raw !== 'string' || !OBJECT_ID.test(raw)) {
      throw new ForbiddenException(PROJECT_READ_REFUSAL);
    }

    const userId = actorIdOf(request?.user);
    if (!userId) {
      throw new ForbiddenException(PROJECT_READ_REFUSAL);
    }

    let projectId = raw.toLowerCase();
    if (options.entity) {
      const record = await this.findOne(options.entity.collection, projectId, { projectId: 1 });
      if (!record) return true;
      projectId = idText(record.projectId);
      if (!projectId) {
        throw new ForbiddenException(PROJECT_READ_REFUSAL);
      }
    }

    const project = await this.findOne('projects', projectId, PROJECT_PROJECTION);
    if (projectStanding(project, userId) === 'none') {
      throw new ForbiddenException(PROJECT_READ_REFUSAL);
    }
    return true;
  }
}
