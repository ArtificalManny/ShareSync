// src/calendar/calendar.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR CONTROLLER: REST API
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CalendarService } from './calendar.service';
import {
  CreateEventDto,
  UpdateEventDto,
  CalendarQueryDto,
  RespondToEventDto,
  EventAttendeeDto,
} from './dto/calendar.dto';

@ApiTags('Calendar')
@Controller('calendar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // EVENTS CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('events')
  @ApiOperation({ summary: 'Create a calendar event' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Event created' })
  async createEvent(@Req() req: any, @Body() dto: CreateEventDto) {
    const event = await this.calendarService.create(req.user.userId, dto);
    return { success: true, data: event };
  }

  @Get('events')
  @ApiOperation({ summary: 'Get user events' })
  async getUserEvents(@Req() req: any, @Query() query: CalendarQueryDto) {
    const events = await this.calendarService.findUserEvents(req.user.userId, query);
    return { success: true, data: events };
  }

  @Get('events/upcoming')
  @ApiOperation({ summary: 'Get upcoming events grouped by day' })
  @ApiQuery({ name: 'days', type: Number, required: false })
  async getUpcomingEvents(@Req() req: any, @Query('days') days?: string) {
    const upcoming = await this.calendarService.getUpcomingEvents(
      req.user.userId,
      days ? parseInt(days, 10) : 7,
    );
    return { success: true, data: upcoming };
  }

  @Get('events/project/:projectId')
  @ApiOperation({ summary: 'Get project events' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getProjectEvents(
    @Param('projectId') projectId: string,
    @Query() query: CalendarQueryDto,
  ) {
    const events = await this.calendarService.findProjectEvents(projectId, query);
    return { success: true, data: events };
  }

  @Get('view/:year/:month')
  @ApiOperation({ summary: 'Get calendar view for a month' })
  @ApiParam({ name: 'year', description: 'Year' })
  @ApiParam({ name: 'month', description: 'Month (1-12)' })
  async getCalendarView(
    @Req() req: any,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    const calendar = await this.calendarService.getCalendarView(
      req.user.userId,
      parseInt(year, 10),
      parseInt(month, 10),
    );
    
    // Convert Map to object for JSON serialization
    const calendarObj: Record<string, any[]> = {};
    calendar.forEach((events, date) => {
      calendarObj[date] = events;
    });

    return { success: true, data: calendarObj };
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async getEvent(@Param('id') id: string) {
    const event = await this.calendarService.findById(id);
    return { success: true, data: event };
  }

  @Put('events/:id')
  @ApiOperation({ summary: 'Update an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async updateEvent(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    const event = await this.calendarService.update(id, req.user.userId, dto);
    return { success: true, data: event };
  }

  @Delete('events/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async deleteEvent(@Req() req: any, @Param('id') id: string) {
    await this.calendarService.delete(id, req.user.userId);
    return { success: true, message: 'Event deleted' };
  }

  @Post('events/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async cancelEvent(@Req() req: any, @Param('id') id: string) {
    const event = await this.calendarService.cancel(id, req.user.userId);
    return { success: true, data: event };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ATTENDEES
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('events/:id/respond')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Respond to an event invitation' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async respondToEvent(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: RespondToEventDto,
  ) {
    const event = await this.calendarService.respondToEvent(
      id,
      req.user.userId,
      dto.response,
    );
    return { success: true, data: event };
  }

  @Post('events/:id/attendees')
  @ApiOperation({ summary: 'Add an attendee to event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async addAttendee(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: EventAttendeeDto,
  ) {
    const event = await this.calendarService.addAttendee(
      id,
      req.user.userId,
      dto.userId,
      dto.isOptional,
    );
    return { success: true, data: event };
  }

  @Delete('events/:id/attendees/:attendeeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an attendee from event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiParam({ name: 'attendeeId', description: 'Attendee user ID' })
  async removeAttendee(
    @Param('id') id: string,
    @Param('attendeeId') attendeeId: string,
  ) {
    const event = await this.calendarService.removeAttendee(id, attendeeId);
    return { success: true, data: event };
  }
}
