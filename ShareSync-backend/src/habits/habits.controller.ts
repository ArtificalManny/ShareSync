import {
    Body,
    Controller,
    Get,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
  } from '@nestjs/common';
  import { HabitsService } from './habits.service';
  
  // If you have an auth guard, import & enable it here
  // import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  
  @Controller('habits')
  // @UseGuards(JwtAuthGuard)
  export class HabitsController {
    constructor(private readonly habits: HabitsService) {}
  
    /** GET /habits/cadence?range=14|28&projectId=... */
    @Get('cadence')
    async getCadence(
      @Req() req: any,
      @Query('range') rangeStr?: string,
      @Query('projectId') projectId?: string,
    ) {
      const range = Math.max(1, Number(rangeStr || 14));
      const userId = String(req?.user?._id || req?.user?.id || req?.userId || '');
      return this.habits.computeCadence({ userId, projectId, range });
    }
  
    /** GET /habits/sprintMomentum?range=7|28&projectId=... */
    @Get('sprintMomentum')
    async getSprintMomentum(
      @Req() req: any,
      @Query('range') rangeStr?: string,
      @Query('projectId') projectId?: string,
    ) {
      const range = Math.max(1, Number(rangeStr || 28));
      const userId = String(req?.user?._id || req?.user?.id || req?.userId || '');
      return this.habits.getSprintMomentum({ userId, projectId, range });
    }
  
    /** GET /habits/prefs */
    @Get('prefs')
    async getPrefs(@Req() req: any) {
      const userId = String(req?.user?._id || req?.user?.id || req?.userId || '');
      return this.habits.getPrefs(userId);
    }
  
    /** PUT /habits/prefs */
    @Put('prefs')
    async updatePrefs(@Req() req: any, @Body() patch: any) {
      const userId = String(req?.user?._id || req?.user?.id || req?.userId || '');
      return this.habits.updatePrefs(userId, patch || {});
    }
  
    /** POST /habits/reflections */
    @Post('reflections')
    async postReflection(@Req() req: any, @Body() body: any) {
      const userId = String(req?.user?._id || req?.user?.id || req?.userId || '');
      return this.habits.postReflection(userId, body || {});
    }
  
    /** GET /habits/reflections/latest */
    @Get('reflections/latest')
    async getLatestReflection(@Req() req: any) {
      const userId = String(req?.user?._id || req?.user?.id || req?.userId || '');
      return this.habits.getLatestReflection(userId);
    }
  
    /** POST /habits/nudges/:id/dismiss */
    @Post('nudges/:id/dismiss')
    async dismissNudge(@Req() req: any, @Query() q: any) {
      const userId = String(req?.user?._id || req?.user?.id || req?.userId || '');
      const id = String((q as any)?.id || '');
      return this.habits.dismissNudge(userId, id);
    }
  }
  