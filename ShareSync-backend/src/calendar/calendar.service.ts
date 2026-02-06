// src/calendar/calendar.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR SERVICE: Event scheduling and management
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

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    @InjectModel(CalendarEvent.name)
    private readonly eventModel: Model<CalendarEventDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateEventDto): Promise<CalendarEventDocument> {
    // Validate times
    if (new Date(dto.startTime) >= new Date(dto.endTime)) {
      throw new BadRequestException('End time must be after start time');
    }

    const attendees = dto.attendees?.map((a) => ({
      userId: new Types.ObjectId(a.userId),
      responseStatus: a.userId === userId ? 'accepted' : 'pending',
      isOptional: a.isOptional || false,
      isOrganizer: a.userId === userId,
    })) || [];

    // Add creator as organizer if not in attendees
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

    // Emit event for notifications
    this.eventEmitter.emit('calendar.event.created', {
      eventId: saved._id,
      title: saved.title,
      startTime: saved.startTime,
      createdBy: userId,
      attendees: attendees.map((a) => a.userId.toString()),
    });

    // Create recurring instances if needed
    if (dto.isRecurring && dto.recurrence) {
      await this.generateRecurringInstances(saved);
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

    // Group by date
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
    const event = await this.findById(eventId);

    // Check permission
    if (event.createdBy.toString() !== userId) {
      const isAttendee = event.attendees.some(
        (a) => a.userId.toString() === userId && a.isOrganizer,
      );
      if (!isAttendee) {
        throw new BadRequestException('Only organizer can update event');
      }
    }

    Object.assign(event, dto);
    const saved = await event.save();

    // Notify attendees of changes
    this.eventEmitter.emit('calendar.event.updated', {
      eventId: saved._id,
      title: saved.title,
      updatedBy: userId,
      attendees: event.attendees.map((a) => a.userId.toString()),
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

    // Cancel recurring instances
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

    // Delete recurring instances
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
    count: number = 52, // Default to 1 year of weekly events
  ): Promise<void> {
    if (!event.recurrence) return;

    const instances: Partial<CalendarEvent>[] = [];
    let currentDate = new Date(event.startTime);
    const duration = event.endTime.getTime() - event.startTime.getTime();
    const maxDate = event.recurrence.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const maxOccurrences = event.recurrence.occurrences || count;

    let occurrenceCount = 0;

    while (currentDate <= maxDate && occurrenceCount < maxOccurrences) {
      // Skip the first occurrence (it's the parent event)
      if (occurrenceCount > 0) {
        const instanceStart = new Date(currentDate);
        const instanceEnd = new Date(instanceStart.getTime() + duration);

        instances.push({
          title: event.title,
          description: event.description,
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

      // Calculate next occurrence
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
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Find events starting in the next hour
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
          // Send reminder
          this.eventEmitter.emit('calendar.reminder', {
            eventId: event._id,
            title: event.title,
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
