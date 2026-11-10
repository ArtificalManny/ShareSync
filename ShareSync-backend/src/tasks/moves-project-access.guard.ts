import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  OBJECT_ID,
  PROJECT_STANDING_FIELDS,
  actorIdOf,
  idText,
  projectStanding,
} from '../common/guards/project-standing';
import { Project } from '../projects/schemas/project.schema';
import { Task } from './schemas/task.schema';

// openshare-moves-project-access-v1 (R51)
//
// Authorization for every route of the Moves controller (`/tasks`). Runs after
// JwtAuthGuard. The service still runs its own project check on every route.
//
// - Reading (GET/HEAD) is unchanged and left to the service: the owner, any
//   member, or a spectator of a public or listed project that isn't archived.
// - Following a Move (changing your own watch settings): the owner or any
//   current member. Spectators aren't members, so they can't add themselves
//   to a Move's followers.
// - Everything else (create, edit, move, complete, delete, comment, attach,
//   reference a Vault file, log time): the owner, or a member whose role is
//   owner, admin or member. Viewers, guests and spectators only read.
//
// The project is the one the Move belongs to; for a new Move it is the
// projectId in the body, the same field the service then saves. IDs that
// aren't ObjectIds are refused before any database query, and a database error
// refuses the request: an outage never becomes access. A write route that
// isn't listed here is treated as a write, so new routes start closed.

type Access = 'read' | 'follow' | 'write';

const READ_METHODS = new Set(['GET', 'HEAD']);
const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

// Handlers that only change the caller's own settings on a Move. The handler is
// chosen by the server's routing, not by the client.
const FOLLOW_HANDLERS = new Set(['updateWatchSettings']);

@Injectable()
export class MovesProjectAccessGuard implements CanActivate {
  constructor(
    @InjectModel(Project.name) private readonly projects: Model<Project>,
    @InjectModel(Task.name) private readonly tasks: Model<Task>,
  ) {}

  private accessFor(method: string, handlerName: string): Access {
    if (READ_METHODS.has(method)) return 'read';
    if (!WRITE_METHODS.has(method)) {
      throw new ForbiddenException('Unsupported Move operation');
    }
    return FOLLOW_HANDLERS.has(handlerName) ? 'follow' : 'write';
  }

  private async projectIdFor(request: any): Promise<string> {
    const params = request?.params || {};

    if (params.id !== undefined) {
      const taskId = params.id;
      if (typeof taskId !== 'string' || !OBJECT_ID.test(taskId)) {
        throw new BadRequestException('Invalid Move ID');
      }

      let task: any;
      try {
        task = await this.tasks
          .findById(new Types.ObjectId(taskId))
          .select('projectId')
          .lean()
          .exec();
      } catch {
        throw new ServiceUnavailableException('Move authorization unavailable');
      }

      if (!task) {
        throw new NotFoundException('Move not found');
      }

      const projectId = idText(task.projectId);
      if (!projectId) {
        throw new ForbiddenException('Not authorized for this project');
      }
      return projectId;
    }

    // A new Move: the project the service will save it in.
    const projectId = request?.body?.projectId;
    if (typeof projectId !== 'string' || !OBJECT_ID.test(projectId)) {
      throw new BadRequestException('A valid projectId is required');
    }
    return projectId.toLowerCase();
  }

  private async loadProject(projectId: string): Promise<any> {
    try {
      return await this.projects
        .findById(new Types.ObjectId(projectId))
        .select(PROJECT_STANDING_FIELDS)
        .lean()
        .exec();
    } catch {
      throw new ServiceUnavailableException('Move authorization unavailable');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const access = this.accessFor(
      String(request?.method ?? '').toUpperCase(),
      String(context.getHandler()?.name ?? ''),
    );

    if (access === 'read') {
      return true;
    }

    const userId = actorIdOf(request?.user);
    if (!userId) {
      throw new ForbiddenException('Not authorized for this project');
    }

    const projectId = await this.projectIdFor(request);
    const project = await this.loadProject(projectId);
    const standing = projectStanding(project, userId);

    if (access === 'follow') {
      if (standing === 'writer' || standing === 'reader') return true;
      throw new ForbiddenException('Only project members can follow Moves');
    }

    if (standing === 'writer') return true;
    throw new ForbiddenException('Not authorized to change Moves in this project');
  }
}
