// backend/src/projects/project.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  Query,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  CanManageProject,
  CanViewProject,
  ProjectPermissionGuard,
} from './guards/project-permission.guard';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { UpdateProjectIconDto } from './dto/update-project-icon.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(
    private readonly project: ProjectService,
    private readonly realtime: RealtimeGateway,
  ) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateProjectDto) {
    const userId = req?.user?.sub;
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    // NOTE:
    // CreateProjectDto in your codebase currently does not declare title/category/status/privacy/members.
    // Runtime requests DO send them, so we safely read from (dto as any).
    const dtoAny = dto as any;

    if (!dtoAny?.title?.trim()) {
      throw new HttpException('Title is required', HttpStatus.BAD_REQUEST);
    }

    const doc = await this.project.create({
      title: String(dtoAny.title).trim(),
      description: String(dtoAny.description ?? '').trim(),
      category: String(dtoAny.category ?? ''),
      status: String(dtoAny.status ?? 'Not Started'),
      privacy: String(dtoAny.privacy ?? 'Private'),
      members: (dtoAny.members ?? []).map((m: any) => ({
        ...m,
        // schema expects MemberRole (not guaranteed to be string union)
        role: (m?.role ?? 'member') as any,
        // schema expects joinedAt (required)
        joinedAt: new Date(),
        // preserve legacy addedAt for compatibility
        addedAt: new Date(),
      })),
      userId,
    } as any);

    this.realtime.emitToProject(doc._id.toString(), 'project:created', {
      projectId: doc._id.toString(),
      project: doc,
    });

    return doc;
  }

  @Get('quick')
  async quick(@Req() req, @Query('limit') limit = '6') {
    const userId = req?.user?.sub;
    const n = Math.max(1, Math.min(12, parseInt(limit as string, 10) || 6));

    const items = await this.project.findAll(userId);
    return (items || [])
      .slice(0, n)
      .map((p: any) => ({
        _id: String(p._id),
        title: p.title ?? 'Untitled',
        avatar: p.avatar ?? '',
        lastActivityAt: p.updatedAt ?? p.createdAt ?? new Date().toISOString(),
        unreadCount: 0,
      }));
  }

  @Get('quiet')
  async getQuietProjects(@Req() req) {
    const userId = req?.user?.sub;
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const projects = await this.project.findAll(userId);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const quietProjects: any[] = [];

    for (const project of projects as any[]) {
      if ((project as any).status === 'Completed') continue;

      const lastActivity = (project as any).updatedAt || (project as any).createdAt;
      const isQuiet = new Date(lastActivity) < threeDaysAgo;

      if (isQuiet) {
        const daysSinceActivity = Math.floor(
          (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24),
        );

        const quickWins = [
          'Update README (2 min)',
          'Review pending tasks (5 min)',
          'Add one small task (3 min)',
          'Check in with team (1 min)',
          'Document one decision (4 min)',
          'Update project status (2 min)',
        ];
        const quickWin = quickWins[Math.floor(Math.random() * quickWins.length)];

        quietProjects.push({
          _id: (project as any)._id,
          title: (project as any).title,
          daysSinceActivity,
          quickWin,
        });
      }
    }

    return {
      count: quietProjects.length,
      projects: quietProjects,
    };
  }

  @Get()
  async list(@Req() req, @Query() query: any) {
    const userId = req?.user?.sub;
    const projects = await this.project.list(userId, query);

    // Add team balance to each project
    const projectsWithBalance = await Promise.all(
      (projects as any[]).map(async (project: any) => {
        const balance = await this.calculateTeamBalance(project);
        return { ...project, teamBalance: balance };
      }),
    );

    return projectsWithBalance;
  }

  // Helper method to calculate team balance
  private async calculateTeamBalance(project: any) {
    // Get ships from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentShips = (project.ships || []).filter(
      (ship: any) => new Date(ship.createdAt) >= sevenDaysAgo,
    );

    if (recentShips.length === 0) {
      return {
        status: 'balanced',
        message: '✅ No recent activity',
        distribution: [],
      };
    }

    // Count contributions per user
    const contributionCounts: { [key: string]: number } = {};
    recentShips.forEach((ship: any) => {
      const userId = ship.userId || ship.createdBy;
      contributionCounts[userId] = (contributionCounts[userId] || 0) + 1;
    });

    // Calculate percentages
    const total = recentShips.length;
    const distribution = Object.entries(contributionCounts).map(([userId, count]) => ({
      userId,
      count,
      percentage: (count / total) * 100,
    }));

    // Sort by contribution count
    distribution.sort((a, b) => b.count - a.count);

    // Determine balance status
    const topTwoPercentage = distribution
      .slice(0, 2)
      .reduce((sum, d) => sum + d.percentage, 0);

    let status: string;
    let message: string;

    if (topTwoPercentage > 80) {
      status = 'heavy';
      message = '⚠️ 2 people carrying most work';
    } else if (topTwoPercentage > 60) {
      status = 'moderate';
      message = '⚡ Work somewhat concentrated';
    } else {
      status = 'balanced';
      message = '✅ Work well distributed';
    }

    return { status, message, distribution };
  }

  @Get(':id')
  @UseGuards(ProjectPermissionGuard)
  @CanViewProject()
  async getOne(@Req() req, @Param('id') id: string) {
    const userId = req?.user?.sub;
    const project = await this.project.findOneForUser(userId, id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  @Get(':id/heartbeat')
  @UseGuards(ProjectPermissionGuard)
  @CanViewProject()
  async getHeartbeat(@Req() req, @Param('id') id: string) {
    const userId = req?.user?.sub;
    const project = await this.project.findOneForUser(userId, id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Calculate heartbeat metrics
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const ships = (project as any).ships || [];
    const shipsThisWeek = ships.filter((s: any) => new Date(s.createdAt) >= sevenDaysAgo).length;

    // Active members (shipped in last 7 days)
    const activeUserIds = new Set(
      ships
        .filter((s: any) => new Date(s.createdAt) >= sevenDaysAgo)
        .map((s: any) => s.userId || s.createdBy),
    );
    const activeMembers = activeUserIds.size;
    const totalMembers = ((project as any).members || []).length;

    // Calculate user's days since last ship
    const userShips = ships.filter((s: any) => (s.userId || s.createdBy) === userId);
    const userLastShip =
      userShips.length > 0 ? Math.max(...userShips.map((s: any) => new Date(s.createdAt).getTime())) : null;
    const userDaysSinceShip = userLastShip
      ? Math.floor((Date.now() - userLastShip) / (1000 * 60 * 60 * 24))
      : 999;

    return {
      shipsThisWeek,
      activeMembers,
      totalMembers,
      avgFocusPerDay: 1.8,
      onTimePercentage: 78,
      peakDays: ['Tue', 'Thu'],
      peakTime: 'evenings',
      coWorkingMultiplier: 2.1,
      userDaysSinceShip,
      streakDays: 7,
    };
  }

  @Get(':id/work-balance')
  @UseGuards(ProjectPermissionGuard)
  @CanViewProject()
  async getWorkBalance(@Req() req, @Param('id') id: string) {
    const userId = req?.user?.sub;
    const project = await this.project.findOneForUser(userId, id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentShips = ((project as any).ships || []).filter(
      (ship: any) => new Date(ship.createdAt) >= sevenDaysAgo,
    );

    if (recentShips.length === 0) {
      return {
        distribution: [],
        fairnessScore: 1.0,
        status: 'unknown',
        message: 'No recent activity to analyze',
        giniCoefficient: 1.0,
      };
    }

    const shipCounts: { [key: string]: number } = {};
    recentShips.forEach((ship: any) => {
      const uid = ship.userId || ship.createdBy;
      shipCounts[uid] = (shipCounts[uid] || 0) + 1;
    });

    const members = (project as any).members || [];
    const distribution = Object.entries(shipCounts)
      .map(([uid, count]) => {
        const member = members.find((m: any) => String(m.userId || m._id) === String(uid));

        return {
          userId: uid,
          name: member?.firstName || member?.name || 'Unknown',
          avatar: member?.avatar || null,
          ships: count,
          percentage: (count / recentShips.length) * 100,
        };
      })
      .sort((a, b) => b.ships - a.ships);

    const sortedShips = distribution.map((d) => d.ships).sort((a, b) => a - b);
    const n = sortedShips.length;
    const sumOfProducts = sortedShips.reduce((sum, ships, i) => sum + ships * (i + 1), 0);
    const sumOfShips = sortedShips.reduce((sum, ships) => sum + ships, 0);
    const giniCoefficient = n === 0 ? 0 : (2 * sumOfProducts) / (n * sumOfShips) - (n + 1) / n;

    let status: string;
    let message: string;

    if (giniCoefficient < 0.4) {
      status = 'balanced';
      message = '✅ Work is well distributed across the team';
    } else if (giniCoefficient < 0.6) {
      status = 'moderate';
      message = 'Most work from 2 teammates. Consider checking in or redistributing tasks';
    } else {
      status = 'heavy';
      message = '⚠️ Heavy concentration - top contributors may need support';
    }

    return {
      distribution,
      fairnessScore: giniCoefficient,
      status,
      message,
      giniCoefficient,
    };
  }

  @Get(':id/team-rhythm')
  @UseGuards(ProjectPermissionGuard)
  @CanViewProject()
  async getTeamRhythm(@Req() req, @Param('id') id: string) {
    const userId = req?.user?.sub;
    const project = await this.project.findOneForUser(userId, id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const ships = (project as any).ships || [];

    if (ships.length === 0) {
      return {
        peakDays: [],
        peakHours: [],
        dayDistribution: {},
        hourDistribution: {},
        message: 'Not enough data yet',
      };
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCounts: { [key: string]: number } = {};
    const hourCounts: { [key: number]: number } = {};

    ships.forEach((ship: any) => {
      const date = new Date(ship.createdAt);
      const day = dayNames[date.getDay()];
      const hour = date.getHours();

      dayCounts[day] = (dayCounts[day] || 0) + 1;
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakDays = Object.entries(dayCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([day]) => day);

    const peakHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([hour]) => parseInt(hour, 10));

    const avgPeakHour = peakHours.reduce((sum, h) => sum + h, 0) / peakHours.length;
    const peakTime =
      avgPeakHour < 12 ? 'mornings' : avgPeakHour < 17 ? 'afternoons' : 'evenings';

    return {
      peakDays,
      peakHours,
      peakTime,
      dayDistribution: dayCounts,
      hourDistribution: hourCounts,
      message: `Team is most active on ${peakDays.join('/')} during ${peakTime}`,
    };
  }

  @Get(':id/members')
  @UseGuards(ProjectPermissionGuard)
  @CanViewProject()
  async getMembers(@Req() req, @Param('id') id: string) {
    const userId = req?.user?.sub;
    const project = await this.project.findOneForUser(userId, id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return {
      projectId: id,
      members: (project as any).members || [],
      invites: (project as any).invites || [],
    };
  }

  @Get(':id/momentum')
  @UseGuards(ProjectPermissionGuard)
  @CanViewProject()
  async getProjectMomentum(@Req() req, @Param('id') id: string) {
    const userId = req?.user?.sub;
    const project = await this.project.findOneForUser(userId, id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Calculate project momentum metrics
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const tasks = (project as any).tasks || [];
    const ships = (project as any).ships || [];

    // Task velocity (last 7 days)
    const recentTasks = tasks.filter((t: any) => new Date(t.createdAt).getTime() >= weekAgo);
    const completedRecent = recentTasks.filter((t: any) => t.status === 'completed').length;
    const velocity = recentTasks.length > 0 ? (completedRecent / recentTasks.length) * 100 : 0;

    // Ship frequency
    const shipsThisWeek = ships.filter((s: any) => new Date(s.createdAt).getTime() >= weekAgo).length;
    const shipsThisMonth = ships.filter((s: any) => new Date(s.createdAt).getTime() >= monthAgo).length;

    // Team activity
    const activeMembers = new Set(
      ships
        .filter((s: any) => new Date(s.createdAt).getTime() >= weekAgo)
        .map((s: any) => s.userId || s.createdBy),
    ).size;

    // Calculate momentum score (0-100)
    const velocityScore = velocity * 0.4;
    const shipScore = Math.min(shipsThisWeek * 10, 40);
    const teamScore = Math.min(activeMembers * 5, 20);
    const momentumScore = Math.round(velocityScore + shipScore + teamScore);

    return {
      projectId: id,
      momentumScore,
      velocity: Math.round(velocity),
      shipsThisWeek,
      shipsThisMonth,
      activeMembers,
      totalMembers: ((project as any).members || []).length,
      trend: this.calculateTrend(ships, tasks),
    };
  }

  private calculateTrend(ships: any[], tasks: any[]) {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

    const thisWeekShips = ships.filter((s: any) => new Date(s.createdAt).getTime() >= weekAgo).length;
    const lastWeekShips = ships.filter(
      (s: any) =>
        new Date(s.createdAt).getTime() >= twoWeeksAgo &&
        new Date(s.createdAt).getTime() < weekAgo,
    ).length;

    if (lastWeekShips === 0 && thisWeekShips > 0) return 'up';
    if (thisWeekShips === 0 && lastWeekShips > 0) return 'down';
    if (thisWeekShips > lastWeekShips) return 'up';
    if (thisWeekShips < lastWeekShips) return 'down';
    return 'stable';
  }

  @Patch(':id')
  @UseGuards(ProjectPermissionGuard)
  @CanManageProject()
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() body: Partial<CreateProjectDto>,
  ) {
    const userId = req?.user?.sub;
    const bodyAny = body as any;

    const updated = await this.project.update(id, userId, {
      ...bodyAny,
      members: bodyAny.members?.map((m: any) => ({
        ...m,
        role: (m?.role ?? 'member') as any,
        joinedAt: new Date(),
        addedAt: new Date(),
      })),
    } as any);

    if (!updated) {
      throw new NotFoundException('Project not found');
    }

    this.realtime.emitToProject(id, 'project:updated', {
      projectId: id,
      patch: bodyAny,
    });

    return updated;
  }

  @Post(':id/ship')
  @UseGuards(ProjectPermissionGuard)
  @CanManageProject()
  async ship(@Req() req, @Param('id') id: string) {
    const userId = req?.user?.sub;
    const result = await this.project.shipProject(id, userId);

    this.realtime.emitToProject(id, 'project:shipped', {
      projectId: id,
      shippedAt: new Date().toISOString(),
    });

    return result;
  }

  @Patch(':id/members')
  @UseGuards(ProjectPermissionGuard)
  @CanManageProject()
  async updateMembers(
    @Req() req,
    @Param('id') id: string,
    @Body()
    body: {
      members: Array<{
        userId?: string;
        email?: string;
        role?: 'owner' | 'member' | 'viewer';
      }>;
    },
  ) {
    const userId = req?.user?.sub;
    if (!Array.isArray(body?.members)) {
      throw new HttpException('members[] is required', HttpStatus.BAD_REQUEST);
    }

    const updated = await this.project.updateMembers(
      id,
      userId,
      body.members.map((m: any) => ({
        ...m,
        role: (m?.role ?? 'member') as any,
        // schema requires joinedAt
        joinedAt: new Date(),
        // preserve legacy field too
        addedAt: new Date(),
      })) as any,
    );

    if (!updated) {
      throw new NotFoundException('Project not found');
    }

    this.realtime.emitToProject(id, 'project:membersUpdated', {
      projectId: id,
      members: (updated as any).members,
      invites: (updated as any).invites || [],
    });

    return updated;
  }

  @Patch(':id/icon')
  @UseGuards(ProjectPermissionGuard)
  @CanManageProject()
  async updateIcon(
    @Req() req,
    @Param('id') id: string,
    @Body() body: UpdateProjectIconDto | null,
  ) {
    const userId = req?.user?.sub;

    const icon =
      body && typeof body === 'object' && (body as any).kind && (body as any).value
        ? { kind: (body as any).kind as 'emoji' | 'svg', value: String((body as any).value || '').trim() }
        : null;

    const updated = await this.project.updateIcon(id, userId, icon);
    if (!updated) {
      throw new NotFoundException('Project not found');
    }

    this.realtime.emitToProject(id, 'project:updated', {
      projectId: id,
      patch: { icon: (updated as any).icon ?? null },
    });

    return { projectId: id, patch: { icon: (updated as any).icon ?? null } };
  }

  @Delete(':id')
  @UseGuards(ProjectPermissionGuard)
  @CanManageProject()
  async deleteProject(@Req() req, @Param('id') id: string) {
    const userId = req?.user?.sub;
    const project = await this.project.findOneForUser(userId, id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const member = (project as any).members?.find((m: any) => String(m.userId) === String(userId));
    if (!member || member.role !== 'owner') {
      throw new ForbiddenException('Only project owner can delete the project');
    }

    await this.project.delete(id, userId);

    this.realtime.emitToProject(id, 'project:deleted', {
      projectId: id,
      deletedAt: new Date().toISOString(),
    });

    return { message: 'Project deleted successfully', projectId: id };
  }
}
