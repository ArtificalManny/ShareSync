import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Project } from '../projects/schemas/project.schema';
import { Task } from '../tasks/schemas/task.schema';
import { Milestone } from '../milestones/schemas/milestone.schema';

type MyWorkType = 'task' | 'milestone' | 'checkpoint';
type MyWorkScope = 'assigned' | 'project';

type ParentMilestone = {
  id: string;
  title: string;
};

type MyWorkItem = {
  id: string;
  sourceId: string;
  type: MyWorkType;
  scope: MyWorkScope;
  projectId: string;
  projectName: string;
  projectColor: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: string;
  status: string;
  currentStage: string;
  blocked: boolean;
  completed: boolean;
  completedAt: string | null;
  parentMilestone?: ParentMilestone;
  href: string;
};

type ProjectSummary = {
  id: string;
  name: string;
  color: string;
};

@Injectable()
export class MyWorkService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<any>,

    @InjectModel(Task.name)
    private readonly taskModel: Model<any>,

    @InjectModel(Milestone.name)
    private readonly milestoneModel: Model<any>,
  ) {}

  async getForUser(userId: string) {
    const userObjectId = this.toObjectId(userId);

    const projects = await this.projectModel
      .find(this.buildAccessibleProjectQuery(userObjectId))
      .select(
        '_id title name color status owner ownerId members ' +
          'updatedAt createdAt',
      )
      .sort({ updatedAt: -1 })
      .lean()
      .exec();

    const projectIds = projects.map(
      (project: any) => project._id,
    );

    if (!projectIds.length) {
      return this.emptyResponse();
    }

    const projectMap = new Map<string, ProjectSummary>();

    for (const project of projects) {
      const id = String(project._id);

      projectMap.set(id, {
        id,
        name: String(
          project.title ||
            project.name ||
            'Untitled Project',
        ),
        color: String(project.color || '#8B5CF6'),
      });
    }

    const [tasks, milestones] = await Promise.all([
      this.taskModel
        .find({
          projectId: { $in: projectIds },
          status: {
            $nin: [
              'archived',
              'deleted',
              'ARCHIVED',
              'DELETED',
            ],
          },
          $or: [
            { assigneeId: userObjectId },
            { assignee: userObjectId },
            { assignedTo: userObjectId },
            { assignedToId: userObjectId },
          ],
        })
        .select(
          '_id title name description projectId milestoneId ' +
            'priority status dueDate deadline isBlocking ' +
            'blockedBy completedAt updatedAt createdAt',
        )
        .sort({ dueDate: 1, updatedAt: -1 })
        .lean()
        .exec(),

      this.milestoneModel
        .find({
          projectId: { $in: projectIds },
        })
        .select(
          '_id title description projectId targetDate status ' +
            'progress completedAt blockedBy dependsOn ' +
            'checkpoints color updatedAt createdAt',
        )
        .sort({ targetDate: 1, updatedAt: -1 })
        .lean()
        .exec(),
    ]);

    const milestoneTitleMap = new Map<string, string>();

    for (const milestone of milestones) {
      milestoneTitleMap.set(
        String(milestone._id),
        String(
          milestone.title || 'Untitled milestone',
        ),
      );
    }

    const taskItems = tasks.map((task: any) =>
      this.toTaskItem(
        task,
        projectMap,
        milestoneTitleMap,
      ),
    );

    const milestoneItems: MyWorkItem[] = [];
    const checkpointItems: MyWorkItem[] = [];

    for (const milestone of milestones) {
      milestoneItems.push(
        this.toMilestoneItem(milestone, projectMap),
      );

      checkpointItems.push(
        ...this.toCheckpointItems(
          milestone,
          projectMap,
        ),
      );
    }

    const items = [
      ...taskItems,
      ...milestoneItems,
      ...checkpointItems,
    ].sort((left, right) => {
      if (left.completed !== right.completed) {
        return left.completed ? 1 : -1;
      }

      const leftDue = left.dueDate
        ? new Date(left.dueDate).getTime()
        : Number.POSITIVE_INFINITY;

      const rightDue = right.dueDate
        ? new Date(right.dueDate).getTime()
        : Number.POSITIVE_INFINITY;

      return leftDue - rightDue;
    });

    return {
      generatedAt: new Date().toISOString(),
      projects: Array.from(projectMap.values()),
      summary: {
        total: items.length,
        tasks: taskItems.length,
        milestones: milestoneItems.length,
        checkpoints: checkpointItems.length,
        completed: items.filter(
          (item) => item.completed,
        ).length,
      },
      items,
    };
  }

  private toTaskItem(
    task: any,
    projectMap: Map<string, ProjectSummary>,
    milestoneTitleMap: Map<string, string>,
  ): MyWorkItem {
    const taskId = String(task._id);
    const projectId = String(task.projectId || '');
    const project = projectMap.get(projectId);

    const status = String(
      task.status || 'backlog',
    ).toLowerCase();

    const completed =
      Boolean(task.completedAt) ||
      ['done', 'completed', 'complete'].includes(
        status,
      );

    const milestoneId = task.milestoneId
      ? String(task.milestoneId)
      : '';

    return {
      id: `task_${taskId}`,
      sourceId: taskId,
      type: 'task',
      scope: 'assigned',
      projectId,
      projectName:
        project?.name || 'Untitled Project',
      projectColor:
        project?.color || '#8B5CF6',
      title: String(
        task.title || task.name || 'Untitled task',
      ),
      description: String(task.description || ''),
      dueDate: this.toIso(
        task.dueDate || task.deadline,
      ),
      priority: String(
        task.priority || 'medium',
      ).toLowerCase(),
      status,
      currentStage: status,
      blocked:
        status === 'blocked' ||
        (Array.isArray(task.blockedBy) &&
          task.blockedBy.length > 0),
      completed,
      completedAt: this.toIso(task.completedAt),
      ...(milestoneId
        ? {
            parentMilestone: {
              id: milestoneId,
              title:
                milestoneTitleMap.get(milestoneId) ||
                'Linked milestone',
            },
          }
        : {}),
      href:
        `/projects/${encodeURIComponent(projectId)}` +
        `?tab=flow&taskId=${encodeURIComponent(taskId)}`,
    };
  }

  private toMilestoneItem(
    milestone: any,
    projectMap: Map<string, ProjectSummary>,
  ): MyWorkItem {
    const milestoneId = String(milestone._id);
    const projectId = String(
      milestone.projectId || '',
    );
    const project = projectMap.get(projectId);

    const status = String(
      milestone.status || 'planned',
    ).toLowerCase();

    const progressValue = Number(
      milestone.progress || 0,
    );

    const progress = Number.isFinite(progressValue)
      ? progressValue
      : 0;

    const completed =
      Boolean(milestone.completedAt) ||
      status === 'completed' ||
      progress >= 100;

    const blocked =
      Array.isArray(milestone.blockedBy) &&
      milestone.blockedBy.length > 0;

    return {
      id: `milestone_${milestoneId}`,
      sourceId: milestoneId,
      type: 'milestone',
      scope: 'project',
      projectId,
      projectName:
        project?.name || 'Untitled Project',
      projectColor: String(
        milestone.color ||
          project?.color ||
          '#8B5CF6',
      ),
      title: String(
        milestone.title || 'Untitled milestone',
      ),
      description: String(
        milestone.description || '',
      ),
      dueDate: this.toIso(milestone.targetDate),
      priority:
        status === 'at_risk' ? 'high' : 'normal',
      status,
      currentStage: status,
      blocked,
      completed,
      completedAt: this.toIso(
        milestone.completedAt,
      ),
      href:
        `/projects/${encodeURIComponent(projectId)}` +
        `?tab=roadmap&milestoneId=${encodeURIComponent(
          milestoneId,
        )}`,
    };
  }

  private toCheckpointItems(
    milestone: any,
    projectMap: Map<string, ProjectSummary>,
  ): MyWorkItem[] {
    const checkpoints = Array.isArray(
      milestone.checkpoints,
    )
      ? milestone.checkpoints
      : [];

    const milestoneId = String(milestone._id);
    const milestoneTitle = String(
      milestone.title || 'Untitled milestone',
    );
    const projectId = String(
      milestone.projectId || '',
    );
    const project = projectMap.get(projectId);

    const milestoneStatus = String(
      milestone.status || 'planned',
    ).toLowerCase();

    const blocked =
      Array.isArray(milestone.blockedBy) &&
      milestone.blockedBy.length > 0;

    return checkpoints.map(
      (checkpoint: any, index: number) => {
        const checkpointId = String(
          checkpoint?.id ||
            checkpoint?._id ||
            `checkpoint-${index + 1}`,
        );

        const completed =
          Boolean(checkpoint?.completed) ||
          Boolean(checkpoint?.completedAt);

        return {
          id:
            `checkpoint_${milestoneId}_` +
            checkpointId,
          sourceId: checkpointId,
          type: 'checkpoint',
          scope: 'project',
          projectId,
          projectName:
            project?.name || 'Untitled Project',
          projectColor: String(
            milestone.color ||
              project?.color ||
              '#8B5CF6',
          ),
          title: String(
            checkpoint?.title ||
              'Untitled checkpoint',
          ),
          description: '',
          // Checkpoints currently inherit the
          // parent milestone target date.
          dueDate: this.toIso(
            milestone.targetDate,
          ),
          priority:
            milestoneStatus === 'at_risk'
              ? 'high'
              : 'normal',
          status: completed ? 'done' : 'todo',
          currentStage: completed
            ? 'done'
            : 'todo',
          blocked,
          completed,
          completedAt: this.toIso(
            checkpoint?.completedAt,
          ),
          parentMilestone: {
            id: milestoneId,
            title: milestoneTitle,
          },
          href:
            `/projects/${encodeURIComponent(
              projectId,
            )}` +
            `?tab=roadmap&milestoneId=${encodeURIComponent(
              milestoneId,
            )}`,
        };
      },
    );
  }

  private buildAccessibleProjectQuery(
    userObjectId: Types.ObjectId,
  ) {
    return {
      $and: [
        {
          $or: [
            { ownerId: userObjectId },
            { owner: userObjectId },
            { createdBy: userObjectId },
            { createdById: userObjectId },
            { userId: userObjectId },
            { members: userObjectId },
            { memberIds: userObjectId },
            { collaborators: userObjectId },
            { sharedWith: userObjectId },
            { 'members.userId': userObjectId },
            { 'members.user': userObjectId },
            { 'members.memberId': userObjectId },
          ],
        },
        {
          status: {
            $nin: [
              'archived',
              'deleted',
              'ARCHIVED',
              'DELETED',
            ],
          },
        },
      ],
    };
  }

  private emptyResponse() {
    return {
      generatedAt: new Date().toISOString(),
      projects: [],
      summary: {
        total: 0,
        tasks: 0,
        milestones: 0,
        checkpoints: 0,
        completed: 0,
      },
      items: [],
    };
  }

  private toObjectId(value: string): Types.ObjectId {
    if (!value || !Types.ObjectId.isValid(value)) {
      throw new BadRequestException(
        'Invalid userId',
      );
    }

    return new Types.ObjectId(value);
  }

  private toIso(value: unknown): string | null {
    if (!value) return null;

    const date =
      value instanceof Date
        ? value
        : new Date(String(value));

    return Number.isNaN(date.getTime())
      ? null
      : date.toISOString();
  }
}
