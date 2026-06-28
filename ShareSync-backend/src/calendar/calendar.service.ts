// src/calendar/calendar.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR SERVICE: Event scheduling and management
// + ⭐ Native DB Insert + Shotgun Gateway Broadcast + Live Room Override
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModuleRef } from '@nestjs/core';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CalendarEvent,
  CalendarEventDocument,
  EventStatus,
  RecurrenceFrequency,
} from './schemas/event.schema';
import {
  CreateEventDto,
  UpdateEventDto,
  CalendarQueryDto,
} from './dto/calendar.dto';

// ✅ NEW: Import Task and Sprint schemas for the unified Rhythm query
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { Sprint, SprintDocument } from '../sprints/schemas/sprint.schema';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationPriority,
  NotificationType,
} from '../notifications/schemas/notification.schema';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    @InjectModel(CalendarEvent.name)
    private readonly eventModel: Model<CalendarEventDocument>,
    // ✅ NEW: Injecting the required models for Rhythm aggregation
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    @InjectModel(Sprint.name)
    private readonly sprintModel: Model<SprintDocument>,
    private readonly eventEmitter: EventEmitter2,
    private readonly moduleRef: ModuleRef,
  ) {}

  private async recordProjectActivity(data: {
    userId: string;
    projectId?: string;
    type: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    details?: Record<string, any>;
    metadata?: Record<string, any>;
    payload?: Record<string, any>;
  }): Promise<void> {
    try {
      if (!data?.userId || !Types.ObjectId.isValid(data.userId)) return;
      if (!data?.projectId || !Types.ObjectId.isValid(data.projectId)) return;

      const now = new Date();
      const userObjectId = new Types.ObjectId(data.userId);
      const projectObjectId = new Types.ObjectId(data.projectId);

      const doc: any = {
        userId: userObjectId,
        actorId: userObjectId,
        projectId: projectObjectId,
        type: data.type,
        entityType: data.entityType || null,
        action: data.action || data.type,
        details: data.details || {},
        metadata: data.metadata || {},
        payload: data.payload || {},
        createdAt: now,
        updatedAt: now,
      };

      if (data.entityId) {
        if (Types.ObjectId.isValid(data.entityId)) {
          doc.entityId = new Types.ObjectId(data.entityId);
        }
        doc.entityKey = data.entityId;
      }

      const result = await this.eventModel.db.collection('activities').insertOne(doc);
      const savedActivity = { ...doc, _id: result.insertedId };

      this.eventEmitter.emit('activityCreated', savedActivity);
      this.eventEmitter.emit('activity:created', savedActivity);
      this.eventEmitter.emit('activity.created', savedActivity);
    } catch (err: any) {
      this.logger.warn(`Project activity logging failed (${data?.type}): ${err?.message || err}`);
    }
  }


  // ─────────────────────────────────────────────────────────────────────────────
  // NEW: RHYTHM AGGREGATOR
  // ─────────────────────────────────────────────────────────────────────────────

  async getProjectRhythm(projectId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const pId = new Types.ObjectId(projectId);
    const rhythmItems = [];

    // 1. Get Scheduled Events (Work sessions, meetings)
    const eventFilter: any = { projectId: pId, status: { $ne: EventStatus.CANCELLED } };
    if (startDate) eventFilter.startTime = { $gte: startDate };
    if (endDate) eventFilter.endTime = { ...eventFilter.endTime, $lte: endDate };

    const events = await this.eventModel.find(eventFilter).lean();
    events.forEach((e: any) => {
      const eventDescription = typeof e.description === 'string' ? e.description : '';

      rhythmItems.push({
        id: e._id,
        title: e.title,
        type: 'event',
        startAt: e.startTime,
        endAt: e.endTime,
        status: e.status,
        description: eventDescription,
        notes: eventDescription,
        originalData: {
          ...e,
          description: eventDescription,
          notes: eventDescription,
        },
      });
    });

    // 2. Get Tasks with Due Dates
    const taskFilter: any = { projectId: pId, dueDate: { $exists: true, $ne: null } };
    if (startDate) taskFilter.dueDate = { $gte: startDate };
    if (endDate) taskFilter.dueDate = { ...taskFilter.dueDate, $lte: endDate };

    const tasks = await this.taskModel.find(taskFilter).lean();
    tasks.forEach(t => rhythmItems.push({
      id: t._id,
      title: t.title,
      type: 'task',
      startAt: t.dueDate,
      endAt: t.dueDate,
      status: t.status,
      originalData: t
    }));

    // 3. Get Active/Upcoming Sprints
    const sprintFilter: any = { projectId: pId };
    if (startDate) sprintFilter.endDate = { $gte: startDate };
    if (endDate) sprintFilter.startDate = { $lte: endDate };

    const sprints = await this.sprintModel.find(sprintFilter).lean();
    sprints.forEach(s => rhythmItems.push({
      id: s._id,
      title: s.name,
      type: 'sprint',
      startAt: s.startDate,
      endAt: s.endDate,
      status: s.status,
      originalData: s
    }));

    // Sort everything chronologically by start date
    return rhythmItems.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateEventDto): Promise<CalendarEventDocument> {
    if (new Date(dto.startTime) >= new Date(dto.endTime)) {
      throw new BadRequestException('End time must be after start time');
    }

    const attendees = dto.attendees?.map((a) => ({
      userId: new Types.ObjectId(a.userId),
      responseStatus: a.userId === userId ? 'accepted' : 'pending',
      isOptional: a.isOptional || false,
      isOrganizer: a.userId === userId,
    })) || [];

    if (!attendees.some((a) => a.userId.toString() === userId)) {
      attendees.unshift({
        userId: new Types.ObjectId(userId),
        responseStatus: 'accepted',
        isOptional: false,
        isOrganizer: true,
      });
    }

    const event = new this.eventModel({
      ...dto,
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : undefined,
      sprintId: dto.sprintId ? new Types.ObjectId(dto.sprintId) : undefined,
      linkedTaskId: dto.linkedTaskId ? new Types.ObjectId(dto.linkedTaskId) : undefined,
      createdBy: new Types.ObjectId(userId),
      attendees,
    });

    const saved = await event.save();

    if (dto.projectId) {
      await this.recordProjectActivity({
        userId,
        projectId: dto.projectId,
        type: 'event_created',
        entityType: 'calendar_event',
        entityId: (saved as any)?._id?.toString?.(),
        action: 'created',
        details: {
          eventTitle: (dto as any)?.title || (saved as any)?.title || 'Scheduled session',
          title: (dto as any)?.title || (saved as any)?.title || 'Scheduled session',
          startTime: (saved as any)?.startTime || (saved as any)?.start || (dto as any)?.startTime || null,
          endTime: (saved as any)?.endTime || (saved as any)?.end || (dto as any)?.endTime || null,
        },
        metadata: {
          source: 'schedule',
          eventId: (saved as any)?._id?.toString?.(),
        },
        payload: {
          eventTitle: (dto as any)?.title || (saved as any)?.title || 'Scheduled session',
          eventId: (saved as any)?._id?.toString?.(),
        },
      });
    }

    this.eventEmitter.emit('calendar.event.created', {
      eventId: saved._id,
      title: saved.title,
      startTime: saved.startTime,
      createdBy: userId,
      attendees: attendees.map((a) => a.userId.toString()),
    });

    if (dto.isRecurring && dto.recurrence) {
      await this.generateRecurringInstances(saved);
    }

    // ⭐ DIRECT REALTIME NOTIFICATIONS & LIVE ROOM OVERRIDE
    try {
      let rtGateway: any = null;
      let notifGateway: any = null;
      let notificationsService: NotificationsService | null = null;
      try { rtGateway = this.moduleRef.get('RealtimeGateway', { strict: false }); } catch(e) {}
      try { notifGateway = this.moduleRef.get('NotificationsGateway', { strict: false }); } catch(e) {}
      try { notificationsService = this.moduleRef.get(NotificationsService, { strict: false }); } catch(e) {}

      const db = this.eventModel.db;
      
      // Start with all explicit attendees
      let allAssociatedIds: any[] = [...attendees.map(a => a.userId)];

      // If it's a project event, pull in the whole project team
      let safeProjectName = 'Project';
      if (dto.projectId) {
        const projectObjectId = new Types.ObjectId(dto.projectId);
        const projectDoc = await db.collection('projects').findOne({ _id: projectObjectId });
        if (projectDoc) {
          safeProjectName = typeof projectDoc.name === 'string' && projectDoc.name.trim() ? projectDoc.name.trim() : (projectDoc.title || 'Project');
          const rawMembers = projectDoc.members || projectDoc.sharedWith || projectDoc.participantIds || [];
          allAssociatedIds.push(
            projectDoc.ownerId,
            projectDoc.owner,
            ...rawMembers.map((m: any) => m?.userId || m?._id || m)
          );
        }
      }

      const memberIdsToNotify: string[] = allAssociatedIds
        .filter(Boolean)
        .map(id => id.toString());

      const uniqueMembers: string[] = [...new Set(memberIdsToNotify)];
      const safeEventTitle = typeof dto.title === 'string' && dto.title.trim() ? dto.title.trim() : 'New Event';
      const notifTitle = dto.projectId ? `📅 New Event in ${safeProjectName}` : `📅 You're invited: ${safeEventTitle}`;

      // 1. Notify official DB members, attendees, and the creator.
      // Prefer NotificationsService so in-app + email fanout both run.
      for (const recipientId of uniqueMembers) {
        try {
          const eventData = {
            projectId: dto.projectId,
            projectName: safeProjectName,
            eventId: saved._id.toString(),
            eventTitle: safeEventTitle,
            createdBy: userId,
            emailFanoutEligible: true,
          };

          if (notificationsService?.notify) {
            await notificationsService.notify({
              userId: recipientId,
              type: NotificationType.EVENT_CREATED,
              title: notifTitle,
              body: safeEventTitle,
              icon: '📅',
              priority: NotificationPriority.HIGH,
              triggeredBy: userId,
              data: eventData as any,
              actions: dto.projectId
                ? [{ label: 'View Project', url: `/projects/${dto.projectId}` }]
                : [{ label: 'View Schedule', url: '/home' }],
            } as any);

            continue;
          }

          // Fallback: keep the native insert path if NotificationsService is unavailable.
          const notifResult = await db.collection('notifications').insertOne({
            userId: new Types.ObjectId(recipientId as string),
            type: 'event_created',
            title: notifTitle,
            body: safeEventTitle,
            icon: '📅',
            data: eventData,
            actions: dto.projectId
              ? [{ label: 'View Project', url: `/projects/${dto.projectId}` }]
              : [{ label: 'View Schedule', url: '/home' }],
            channels: ['in_app', 'email'],
            priority: 'high',
            isRead: false,
            isClicked: false,
            isDismissed: false,
            groupCount: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          const newNotif = await db.collection('notifications').findOne({ _id: notifResult.insertedId });

          if (notifGateway && notifGateway.server) {
            notifGateway.server.to(recipientId as string).emit('new_notification', newNotif);
            notifGateway.server.to(`user:${recipientId}`).emit('new_notification', newNotif);
          }
          if (rtGateway && rtGateway.server) {
            rtGateway.server.to(recipientId as string).emit('new_notification', newNotif);
            rtGateway.server.to(`user:${recipientId}`).emit('new_notification', newNotif);
          }

          this.eventEmitter.emit('notification.created', newNotif);
        } catch (innerErr) {
          this.logger.error(`Failed to notify calendar event user ${recipientId}`, innerErr);
        }
      }

      // 2. LIVE ROOM OVERRIDE (Only if tied to a project)
      if (dto.projectId) {
        const liveRoomNotif = {
          _id: new Types.ObjectId(),
          type: 'event_created',
          title: notifTitle,
          body: safeEventTitle,
          data: {
            projectId: dto.projectId,
            projectName: safeProjectName,
            extra: { eventId: saved._id.toString() }
          },
          channels: ['in_app'],
          priority: 'normal',
          isRead: false,
          createdAt: new Date()
        };

        if (notifGateway && notifGateway.server) {
          notifGateway.server.to(`project:${dto.projectId}`).emit('new_notification', liveRoomNotif);
          notifGateway.server.to(dto.projectId).emit('new_notification', liveRoomNotif);
        }
        if (rtGateway && rtGateway.server) {
          rtGateway.server.to(`project:${dto.projectId}`).emit('new_notification', liveRoomNotif);
          rtGateway.server.to(dto.projectId).emit('new_notification', liveRoomNotif);
        }
      }

      this.logger.log(`✅ Event ${saved._id.toString()} natively notified ${uniqueMembers.length} DB recipient(s) AND broadcasted to Live Rooms`);
    } catch (err) {
      this.logger.error('⚠️ Failed to process native event notifications:', err);
    }

    return saved;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────────────────

  async findById(eventId: string): Promise<CalendarEventDocument> {
    const event = await this.eventModel
      .findById(eventId)
      .populate('attendees.userId', 'firstName lastName avatar email')
      .populate('createdBy', 'firstName lastName avatar')
      .populate('projectId', 'name')
      .populate('linkedTaskId', 'title');

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async findUserEvents(
    userId: string,
    query: CalendarQueryDto = {},
  ): Promise<CalendarEventDocument[]> {
    const filter: any = {
      $or: [
        { createdBy: new Types.ObjectId(userId) },
        { 'attendees.userId': new Types.ObjectId(userId) },
      ],
      status: { $ne: EventStatus.CANCELLED },
    };

    if (query.startDate) {
      filter.startTime = { $gte: query.startDate };
    }
    if (query.endDate) {
      filter.endTime = { ...filter.endTime, $lte: query.endDate };
    }
    if (query.projectId) {
      filter.projectId = new Types.ObjectId(query.projectId);
    }
    if (query.type) {
      filter.type = query.type;
    }

    return this.eventModel
      .find(filter)
      .populate('attendees.userId', 'firstName lastName avatar')
      .populate('projectId', 'name')
      .sort({ startTime: 1 });
  }

  async findProjectEvents(
    projectId: string,
    query: CalendarQueryDto = {},
  ): Promise<CalendarEventDocument[]> {
    const filter: any = {
      projectId: new Types.ObjectId(projectId),
      status: { $ne: EventStatus.CANCELLED },
    };

    if (query.startDate) {
      filter.startTime = { $gte: query.startDate };
    }
    if (query.endDate) {
      filter.endTime = { ...filter.endTime, $lte: query.endDate };
    }
    if (query.type) {
      filter.type = query.type;
    }

    return this.eventModel
      .find(filter)
      .populate('attendees.userId', 'firstName lastName avatar')
      .populate('createdBy', 'firstName lastName')
      .sort({ startTime: 1 });
  }

  async getCalendarView(
    userId: string,
    year: number,
    month: number,
  ): Promise<Map<string, CalendarEventDocument[]>> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const events = await this.findUserEvents(userId, { startDate, endDate });

    const calendar = new Map<string, CalendarEventDocument[]>();
    
    for (const event of events) {
      const dateKey = event.startTime.toISOString().split('T')[0];
      if (!calendar.has(dateKey)) {
        calendar.set(dateKey, []);
      }
      calendar.get(dateKey)!.push(event);
    }

    return calendar;
  }

  async getUpcomingEvents(
    userId: string,
    days: number = 7,
  ): Promise<{
    today: CalendarEventDocument[];
    tomorrow: CalendarEventDocument[];
    thisWeek: CalendarEventDocument[];
    upcoming: CalendarEventDocument[];
  }> {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const futureEnd = new Date(todayStart);
    futureEnd.setDate(futureEnd.getDate() + days);

    const events = await this.findUserEvents(userId, {
      startDate: todayStart,
      endDate: futureEnd,
    });

    const today: CalendarEventDocument[] = [];
    const tomorrow: CalendarEventDocument[] = [];
    const thisWeek: CalendarEventDocument[] = [];
    const upcoming: CalendarEventDocument[] = [];

    for (const event of events) {
      const eventDate = event.startTime;
      
      if (eventDate >= todayStart && eventDate <= todayEnd) {
        today.push(event);
      } else if (eventDate >= tomorrowStart && eventDate <= tomorrowEnd) {
        tomorrow.push(event);
      } else if (eventDate <= weekEnd) {
        thisWeek.push(event);
      } else {
        upcoming.push(event);
      }
    }

    return { today, tomorrow, thisWeek, upcoming };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────────────────────

  async update(
    eventId: string,
    userId: string,
    dto: UpdateEventDto,
  ): Promise<CalendarEventDocument> {
    const event = await this.eventModel.findById(eventId).lean();

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const toIdString = (value: any): string => {
      if (!value) return '';
      if (typeof value === 'string') return value;

      // Mongoose ObjectIds can expose _id as themselves.
      // Check ObjectId/toHexString before checking _id/id to avoid recursion.
      if (value instanceof Types.ObjectId) {
        return value.toHexString();
      }

      if (typeof value?.toHexString === 'function') {
        return value.toHexString();
      }

      if (typeof value === 'object') {
        if (value._id && value._id !== value) return toIdString(value._id);
        if (value.id && value.id !== value) return toIdString(value.id);
      }

      if (typeof value.toString === 'function') {
        const str = value.toString();
        return str === '[object Object]' ? '' : str;
      }

      return '';
    };

    const actorId = toIdString(userId);
    const ownerId = toIdString((event as any).userId);
    const projectId = toIdString((event as any).projectId);

    let canUpdate = ownerId === actorId;

    // Optional: allow project members to edit project schedule sessions.
    if (!canUpdate && projectId && Types.ObjectId.isValid(projectId)) {
      const actorValues: any[] = [actorId];

      if (Types.ObjectId.isValid(actorId)) {
        actorValues.push(new Types.ObjectId(actorId));
      }

      const project = await this.eventModel.db.collection('projects').findOne({
        _id: new Types.ObjectId(projectId),
        $or: [
          { owner: { $in: actorValues } },
          { ownerId: { $in: actorValues } },
          { createdBy: { $in: actorValues } },
          { userId: { $in: actorValues } },

          { members: { $in: actorValues } },
          { memberIds: { $in: actorValues } },
          { sharedWith: { $in: actorValues } },
          { participantIds: { $in: actorValues } },
          { collaborators: { $in: actorValues } },

          { 'members.userId': { $in: actorValues } },
          { 'members.user': { $in: actorValues } },
          { 'members.memberId': { $in: actorValues } },
          { 'sharedWith.userId': { $in: actorValues } },
          { 'collaborators.userId': { $in: actorValues } },
        ],
      });

      canUpdate = Boolean(project);
    }

    if (!canUpdate) {
      throw new BadRequestException('Only event owner or project member can update event');
    }

    const raw = (dto || {}) as any;
    const update: Record<string, any> = {};

    const setString = (key: string, value: any) => {
      if (typeof value === 'string') update[key] = value;
    };

    const setBoolean = (key: string, value: any) => {
      if (typeof value === 'boolean') update[key] = value;
    };

    const setDate = (key: string, value: any) => {
      if (value === undefined || value === null || value === '') return;

      const date = value instanceof Date ? value : new Date(value);

      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException(`${key} must be a valid date`);
      }

      update[key] = date;
    };

    const setObjectId = (key: string, value: any) => {
      if (value === undefined || value === null || value === '') return;

      const id = toIdString(value);

      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`${key} must be a valid Mongo ID`);
      }

      update[key] = new Types.ObjectId(id);
    };

    const setEnum = (key: string, value: any, allowed: string[]) => {
      if (value === undefined || value === null || value === '') return;

      if (!allowed.includes(String(value))) {
        throw new BadRequestException(`${key} must be one of: ${allowed.join(', ')}`);
      }

      update[key] = String(value);
    };

    const setNumber = (key: string, value: any) => {
      if (value === undefined || value === null || value === '') return;

      const numberValue = Number(value);

      if (!Number.isFinite(numberValue)) {
        throw new BadRequestException(`${key} must be a number`);
      }

      update[key] = numberValue;
    };

    setString('title', raw.title);

    // Schedule modal notes save into schema.description.
    setString('description', raw.description ?? raw.notes);

    setEnum('type', raw.type, ['focus', 'meeting', 'deadline', 'reminder', 'deep_work', 'standup']);

    // Frontend may send startDate/endDate; schema uses startTime/endTime.
    setDate('startTime', raw.startTime ?? raw.startDate);
    setDate('endTime', raw.endTime ?? raw.endDate);

    setBoolean('isAllDay', raw.isAllDay);
    setString('timezone', raw.timezone);
    setString('location', raw.location);
    setString('color', raw.color);

    if (raw.recurrence !== undefined) update.recurrence = raw.recurrence;
    if (raw.reminders !== undefined) update.reminders = raw.reminders;

    setNumber('xpReward', raw.xpReward);
    setEnum('status', raw.status, ['scheduled', 'cancelled', 'completed']);
    setDate('completedAt', raw.completedAt);

    setObjectId('linkedTaskId', raw.linkedTaskId);
    setObjectId('linkedSprintId', raw.linkedSprintId ?? raw.sprintId);

    if (Object.keys(update).length === 0) {
      const unchanged = await this.eventModel.findById(eventId);
      if (!unchanged) throw new NotFoundException('Event not found');
      return unchanged;
    }

    let saved: CalendarEventDocument | null = null;

    try {
      saved = await this.eventModel.findByIdAndUpdate(
        eventId,
        { $set: update },
        { new: true, runValidators: true },
      );
    } catch (err: any) {
      console.error('[CalendarService.update] failed', {
        eventId,
        userId,
        update,
        errorName: err?.name,
        errorMessage: err?.message,
        stack: err?.stack,
      });

      if (err?.name === 'ValidationError' || err?.name === 'CastError') {
        throw new BadRequestException(err.message);
      }

      throw err;
    }

    if (!saved) {
      throw new NotFoundException('Event not found');
    }

    this.eventEmitter.emit('calendar.event.updated', {
      eventId: saved._id,
      title: saved.title,
      updatedBy: userId,
      attendees: Array.isArray((saved as any).attendees)
        ? (saved as any).attendees.map((a: any) => toIdString(a.userId)).filter(Boolean)
        : [],
    });

    return saved;
  }

  async respondToEvent(
    eventId: string,
    userId: string,
    response: 'accepted' | 'declined' | 'tentative',
  ): Promise<CalendarEventDocument> {
    const event = await this.findById(eventId);

    const attendee = event.attendees.find(
      (a) => a.userId.toString() === userId,
    );

    if (!attendee) {
      throw new BadRequestException('You are not an attendee of this event');
    }

    attendee.responseStatus = response;
    attendee.respondedAt = new Date();

    const saved = await event.save();

    this.eventEmitter.emit('calendar.event.response', {
      eventId: saved._id,
      userId,
      response,
      organizerId: event.createdBy.toString(),
    });

    return saved;
  }

  async addAttendee(
    eventId: string,
    userId: string,
    attendeeId: string,
    isOptional: boolean = false,
  ): Promise<CalendarEventDocument> {
    const event = await this.findById(eventId);

    if (event.attendees.some((a) => a.userId.toString() === attendeeId)) {
      throw new BadRequestException('User is already an attendee');
    }

    event.attendees.push({
      userId: new Types.ObjectId(attendeeId),
      responseStatus: 'pending',
      isOptional,
      isOrganizer: false,
    });

    const saved = await event.save();

    this.eventEmitter.emit('calendar.event.attendee_added', {
      eventId: saved._id,
      attendeeId,
      invitedBy: userId,
    });

    return saved;
  }

  async removeAttendee(
    eventId: string,
    attendeeId: string,
  ): Promise<CalendarEventDocument> {
    const event = await this.findById(eventId);

    event.attendees = event.attendees.filter(
      (a) => a.userId.toString() !== attendeeId,
    );

    return event.save();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CANCEL/DELETE
  // ─────────────────────────────────────────────────────────────────────────────

  async cancel(eventId: string, userId: string): Promise<CalendarEventDocument> {
    const event = await this.findById(eventId);

    if (event.createdBy.toString() !== userId) {
      throw new BadRequestException('Only creator can cancel event');
    }

    event.status = EventStatus.CANCELLED;
    const saved = await event.save();

    if (event.isRecurring) {
      await this.eventModel.updateMany(
        { parentEventId: event._id },
        { status: EventStatus.CANCELLED },
      );
    }

    this.eventEmitter.emit('calendar.event.cancelled', {
      eventId: saved._id,
      title: saved.title,
      cancelledBy: userId,
      attendees: event.attendees.map((a) => a.userId.toString()),
    });

    return saved;
  }

  async delete(eventId: string, userId: string): Promise<void> {
    const event = await this.findById(eventId);

    if (event.createdBy.toString() !== userId) {
      throw new BadRequestException('Only creator can delete event');
    }

    if (event.isRecurring) {
      await this.eventModel.deleteMany({ parentEventId: event._id });
    }

    await this.eventModel.findByIdAndDelete(eventId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RECURRING EVENTS
  // ─────────────────────────────────────────────────────────────────────────────

  private async generateRecurringInstances(
    event: CalendarEventDocument,
    count: number = 52,
  ): Promise<void> {
    if (!event.recurrence) return;

    const instances: Partial<CalendarEvent>[] = [];
    let currentDate = new Date(event.startTime);
    const duration = event.endTime.getTime() - event.startTime.getTime();
    const maxDate = event.recurrence.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const maxOccurrences = event.recurrence.occurrences || count;

    let occurrenceCount = 0;

    while (currentDate <= maxDate && occurrenceCount < maxOccurrences) {
      if (occurrenceCount > 0) {
        const instanceStart = new Date(currentDate);
        const instanceEnd = new Date(instanceStart.getTime() + duration);

        instances.push({
          title: event.title,
        description: (event as any).description || '',
          type: event.type,
          startTime: instanceStart,
          endTime: instanceEnd,
          isAllDay: event.isAllDay,
          timezone: event.timezone,
          projectId: event.projectId,
          createdBy: event.createdBy,
          attendees: event.attendees,
          location: event.location,
          reminders: event.reminders,
          color: event.color,
          isRecurring: false,
          parentEventId: event._id,
          occurrenceDate: instanceStart,
        });
      }

      currentDate = this.getNextOccurrence(currentDate, event.recurrence.frequency, event.recurrence.interval || 1);
      occurrenceCount++;
    }

    if (instances.length > 0) {
      await this.eventModel.insertMany(instances);
    }
  }

  private getNextOccurrence(
    date: Date,
    frequency: RecurrenceFrequency,
    interval: number,
  ): Date {
    const next = new Date(date);

    switch (frequency) {
      case RecurrenceFrequency.DAILY:
        next.setDate(next.getDate() + interval);
        break;
      case RecurrenceFrequency.WEEKLY:
        next.setDate(next.getDate() + 7 * interval);
        break;
      case RecurrenceFrequency.BIWEEKLY:
        next.setDate(next.getDate() + 14 * interval);
        break;
      case RecurrenceFrequency.MONTHLY:
        next.setMonth(next.getMonth() + interval);
        break;
      case RecurrenceFrequency.QUARTERLY:
        next.setMonth(next.getMonth() + 3 * interval);
        break;
      case RecurrenceFrequency.YEARLY:
        next.setFullYear(next.getFullYear() + interval);
        break;
    }

    return next;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REMINDERS CRON
  // ─────────────────────────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_MINUTE)
  async sendEventReminders(): Promise<void> {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const upcomingEvents = await this.eventModel.find({
      startTime: { $gte: now, $lte: oneHourFromNow },
      status: EventStatus.SCHEDULED,
      'reminders.sent': false,
    });

    for (const event of upcomingEvents) {
      for (const reminder of event.reminders) {
        if (reminder.sent) continue;

        const reminderTime = new Date(
          event.startTime.getTime() - reminder.minutesBefore * 60 * 1000,
        );

        if (reminderTime <= now) {
          this.eventEmitter.emit('calendar.reminder', {
            eventId: event._id,
            title: event.title,
        description: (event as any).description || '',
            startTime: event.startTime,
            attendees: event.attendees.map((a) => a.userId.toString()),
            method: reminder.method,
          });

          reminder.sent = true;
        }
      }

      await event.save();
    }
  }
}
