// src/activities/listeners/project-membership-activity.listener.ts
// project-membership-audit-v1

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';

import { ActivitiesService } from '../activities.service';

type MembershipAuditType =
  | 'member_added'
  | 'member_removed'
  | 'permission_role_updated';

@Injectable()
export class ProjectMembershipActivityListener {
  private readonly logger = new Logger(
    ProjectMembershipActivityListener.name,
  );

  constructor(
    private readonly activities: ActivitiesService,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  private getId(value: any): string {
    if (!value) {
      return '';
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      return String(value);
    }

    const candidate =
      value?._id ||
      value?.id ||
      value?.userId ||
      value;

    const normalized =
      typeof candidate?.toString === 'function'
        ? candidate.toString()
        : String(candidate || '');

    if (
      !normalized ||
      normalized === '[object Object]'
    ) {
      return '';
    }

    return normalized;
  }

  private formatRole(value: any): string {
    const normalized = String(
      value || 'member',
    )
      .trim()
      .replace(/[_-]+/g, ' ');

    if (!normalized) {
      return 'Member';
    }

    return (
      normalized.charAt(0).toUpperCase() +
      normalized.slice(1)
    );
  }

  private async resolveUserName(
    userId: string,
  ): Promise<string> {
    if (!Types.ObjectId.isValid(userId)) {
      return 'Project member';
    }

    try {
      const user = await this.connection
        .collection('users')
        .findOne(
          {
            _id: new Types.ObjectId(userId),
          },
          {
            projection: {
              displayName: 1,
              firstName: 1,
              lastName: 1,
              username: 1,
              email: 1,
            },
          },
        );

      const firstLast = [
        user?.firstName,
        user?.lastName,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      return (
        String(user?.displayName || '').trim() ||
        firstLast ||
        String(user?.username || '').trim() ||
        String(user?.email || '').trim() ||
        'Project member'
      );
    } catch (err: any) {
      this.logger.warn(
        `Could not resolve membership-audit user ${userId}: ${
          err?.message || err
        }`,
      );

      return 'Project member';
    }
  }

  private async persist(args: {
    projectId: any;
    actorUserId: any;
    targetUserId: any;
    type: MembershipAuditType;
    role?: any;
    previousRole?: any;
    source: string;
  }): Promise<void> {
    const projectId = this.getId(args.projectId);
    const actorUserId = this.getId(args.actorUserId);
    const targetUserId = this.getId(args.targetUserId);

    if (
      !Types.ObjectId.isValid(projectId) ||
      !Types.ObjectId.isValid(actorUserId) ||
      !Types.ObjectId.isValid(targetUserId)
    ) {
      this.logger.warn(
        `Membership audit skipped: invalid identifiers ` +
          `project=${projectId} actor=${actorUserId} ` +
          `target=${targetUserId}`,
      );

      return;
    }

    try {
      const [actorName, targetName] =
        await Promise.all([
          this.resolveUserName(actorUserId),
          this.resolveUserName(targetUserId),
        ]);

      const roleLabel = this.formatRole(
        args.role,
      );

      const previousRoleLabel =
        this.formatRole(
          args.previousRole,
        );

      let targetTitle = targetName;
      let message =
        `${actorName} updated ${targetName}`;

      if (
        args.type === 'member_added' &&
        args.source === 'invite_acceptance'
      ) {
        targetTitle = roleLabel;

        message =
          `${actorName} joined the project ` +
          `as ${roleLabel}`;
      } else if (
        args.type === 'member_added'
      ) {
        targetTitle =
          `${targetName} as ${roleLabel}`;

        message =
          `${actorName} added ${targetName} ` +
          `as ${roleLabel}`;
      } else if (
        args.type === 'member_removed'
      ) {
        targetTitle =
          `${targetName} from the project`;

        message =
          `${actorName} removed ${targetName} ` +
          'from the project';
      } else if (
        args.type ===
        'permission_role_updated'
      ) {
        targetTitle =
          `${targetName} from ` +
          `${previousRoleLabel} to ${roleLabel}`;

        message =
          `${actorName} changed ${targetName}'s ` +
          `permission from ${previousRoleLabel} ` +
          `to ${roleLabel}`;
      }

      await this.activities.record({
        userId: actorUserId,
        projectId,
        type: args.type,
        entityType: 'user',
        entityId: targetUserId,
        action:
          args.type ===
          'permission_role_updated'
            ? undefined
            : args.type,
        details: {
          title: targetTitle,
          targetTitle,
          targetUserId,
          actorName,
          userName: actorName,
          message,
          description: message,
          role: args.role || null,
          previousRole:
            args.previousRole || null,
          source: args.source,
          critical: true,
        },
        metadata: {
          source: args.source,
          auditCategory:
            'membership_permissions',
          title: targetTitle,
          targetTitle,
          targetUserId,
          actorName,
          role: args.role || null,
          previousRole:
            args.previousRole || null,
          critical: true,
        },
        payload: {
          source: args.source,
          message,
          title: targetTitle,
          targetTitle,
          targetUserId,
          actorName,
          role: args.role || null,
          previousRole:
            args.previousRole || null,
          critical: true,
        },
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to persist membership audit ` +
          `type=${args.type} project=${projectId}`,
        err?.stack || String(err),
      );
    }
  }

  @OnEvent('project.member.added', {
    async: true,
  })
  async handleMemberAdded(
    event: any,
  ): Promise<void> {
    await this.persist({
      projectId: event?.projectId,
      actorUserId: event?.addedBy,
      targetUserId: event?.memberId,
      type: 'member_added',
      role: event?.role,
      source: 'direct_member_add',
    });
  }

  @OnEvent('project.member.removed', {
    async: true,
  })
  async handleMemberRemoved(
    event: any,
  ): Promise<void> {
    await this.persist({
      projectId: event?.projectId,
      actorUserId: event?.removedBy,
      targetUserId: event?.memberId,
      type: 'member_removed',
      role: event?.removedRole,
      source: 'member_removal',
    });
  }

  @OnEvent('project.members.changed', {
    async: true,
  })
  async handlePermissionChange(
    event: any,
  ): Promise<void> {
    if (
      event?.action !==
      'permission_role_updated'
    ) {
      return;
    }

    const previousRole = String(
      event?.previousRole || '',
    );

    const role = String(
      event?.role || '',
    );

    if (
      previousRole &&
      role &&
      previousRole.toLowerCase() ===
        role.toLowerCase()
    ) {
      return;
    }

    await this.persist({
      projectId: event?.projectId,
      actorUserId: event?.changedBy,
      targetUserId: event?.memberId,
      type: 'permission_role_updated',
      previousRole,
      role,
      source: 'permission_role_change',
    });
  }

  @OnEvent('project.invite.accepted', {
    async: true,
  })
  async handleInviteAccepted(
    event: any,
  ): Promise<void> {
    if (event?.memberAdded !== true) {
      return;
    }

    await this.persist({
      projectId: event?.projectId,
      actorUserId: event?.acceptedBy,
      targetUserId: event?.acceptedBy,
      type: 'member_added',
      role: event?.role,
      source: 'invite_acceptance',
    });
  }
}
