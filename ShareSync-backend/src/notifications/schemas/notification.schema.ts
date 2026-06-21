// src/notifications/schemas/notification.schema.ts
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION SCHEMA: Real-time alerts and activity tracking
// ═══════════════════════════════════════════════════════════════════════════════

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_UPDATED = 'task_updated',
  TASK_COMMENT = 'task_comment',
  TASK_MENTION = 'task_mention',
  TASK_DUE_SOON = 'task_due_soom',
  TASK_OVERDUE = 'task_overdue',

  PROJECT_INVITE = 'project_invite',
  PROJECT_UPDATE = 'project_update',
  PROJECT_MEMBER_JOINED = 'project_member_joined',
  PROJECT_MEMBER_LEFT = 'project_member_left',

  // ✅ Phase 3: spectator followers / public loop
  PROJECT_SHIP_UPDATE = 'project_ship_update',
  PROJECT_MILESTONE_REACHED = 'project_milestone_reached',

  EVENT_CREATED = 'event_created',

  MESSAGE_NEW = 'message_new',
  MESSAGE_MENTION = 'message_mention',
  MESSAGE_REACTION = 'message_reaction',

  XP_GAINED = 'xp_gained',
  LEVEL_UP = 'level_up',
  BADGE_EARNED = 'badge_earned',
  STREAK_MILESTONE = 'streak_milestone',
  STREAK_AT_RISK = 'streak_at_risk',
  LEADERBOARD_CHANGE = 'leaderboard_change',

  SPRINT_STARTED = 'sprint_started',
  SPRINT_ENDING = 'sprint_ending',
  SPRINT_COMPLETED = 'sprint_completed',

  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  SYSTEM_MAINTENANCE = 'system_maintenance',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
}

@Schema({ _id: false })
export class NotificationAction {
  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  type?: string;
}

@Schema({ _id: false })
export class NotificationData {
  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;

  @Prop()
  projectName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Task' })
  taskId?: Types.ObjectId;

  @Prop()
  taskTitle?: string;

  @Prop({ type: Types.ObjectId, ref: 'Conversation' })
  conversationId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  messageId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Sprint' })
  sprintId?: Types.ObjectId;

  @Prop()
  sprintName?: string;

  @Prop()
  xpAmount?: number;

  @Prop()
  newLevel?: number;

  @Prop()
  badgeName?: string;

  @Prop()
  badgeIcon?: string;

  @Prop()
  streakCount?: number;

  // ✅ Phase 3: follower updates
  @Prop()
  shipTitle?: string;

  @Prop()
  milestoneName?: string;

  @Prop({ type: Object })
  extra?: Record<string, any>;
}

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      (ret as any).id = (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    },
  },
})
export class Notification {
  @ApiProperty({ description: 'User who receives this notification' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @ApiProperty({ enum: NotificationType })
  @Prop({ type: String, enum: NotificationType, required: true, index: true })
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  @Prop({ required: true, maxlength: 200 })
  title: string;

  @ApiProperty({ description: 'Notification body/message' })
  @Prop({ required: true, maxlength: 1000 })
  body: string;

  @ApiProperty({ description: 'Notification icon' })
  @Prop()
  icon?: string;

  @ApiProperty({ description: 'Notification image URL' })
  @Prop()
  imageUrl?: string;

  @ApiProperty({ enum: NotificationPriority })
  @Prop({ type: String, enum: NotificationPriority, default: NotificationPriority.NORMAL })
  priority: NotificationPriority;

  @ApiProperty({ description: 'Channels this notification was sent through' })
  @Prop({ type: [String], enum: NotificationChannel, default: [NotificationChannel.IN_APP] })
  channels: NotificationChannel[];

  @ApiProperty({ description: 'User who triggered this notification' })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  triggeredBy?: Types.ObjectId;

  @ApiProperty({ description: 'Additional notification data' })
  @Prop({ type: NotificationData, default: {} })
  data: NotificationData;

  @ApiProperty({ description: 'Action buttons' })
  @Prop({ type: [NotificationAction], default: [] })
  actions: NotificationAction[];

  @ApiProperty({ description: 'Has notification been read' })
  @Prop({ type: Boolean, default: false, index: true })
  isRead: boolean;

  @ApiProperty({ description: 'When notification was read' })
  @Prop({ type: Date })
  readAt?: Date;

  @ApiProperty({ description: 'Has notification been clicked/actioned' })
  @Prop({ type: Boolean, default: false })
  isClicked: boolean;

  @ApiProperty({ description: 'When notification was clicked' })
  @Prop({ type: Date })
  clickedAt?: Date;

  @ApiProperty({ description: 'Has notification been dismissed' })
  @Prop({ type: Boolean, default: false })
  isDismissed: boolean;

  @ApiProperty({ description: 'Group key for collapsing similar notifications' })
  @Prop({ index: true })
  groupKey?: string;

  @ApiProperty({ description: 'Count of grouped notifications' })
  @Prop({ type: Number, default: 1 })
  groupCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, groupKey: 1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

NotificationSchema.statics.findUnread = function (userId: string, limit: number = 20) {
  return this.find({ userId: new Types.ObjectId(userId), isRead: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('triggeredBy', 'firstName lastName avatar');
};

NotificationSchema.statics.countUnread = function (userId: string) {
  return this.countDocuments({ userId: new Types.ObjectId(userId), isRead: false });
};

NotificationSchema.statics.markAllAsRead = function (userId: string) {
  return this.updateMany(
    { userId: new Types.ObjectId(userId), isRead: false },
    { isRead: true, readAt: new Date() },
  );
};
