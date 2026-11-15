// src/projects/projects.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS CONTROLLER: REST API Endpoints
// + Phase 3: spectator follows (/projects/:id/follow)
// + Overview route for ProjectHome richer dashboard payload
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
  HttpStatus,
  HttpCode,
  Logger,
  UploadedFile,
  BadRequestException,
  ServiceUnavailableException,
  } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService, ProjectQueryOptions, CompleteProjectPayload, ReopenProjectPayload } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  UpdateProjectDto,
  UpdateProjectPreferencesDto,
} from './dto/update-project.dto';
import { AddMemberDto, UpdateMemberRoleDto } from './dto/project-member.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';
import { ProjectStatus } from './schemas/project.schema';

// ✅ Phase 3: follows
import { ProjectFollowService } from '../follows/project-follow.service';
import { FollowProjectDto } from '../follows/dto/follow-project.dto';
import { UpdateFollowPrefsDto } from '../follows/dto/update-follow-prefs.dto';
import { TextModerationInterceptor } from '../moderation/moderation.interceptor';
import {
  ModerationService,
  ModerationDecision,
  ModerationCategory,
} from '../moderation/moderation.service';
import { ImageModerationService } from '../moderation/image-moderation.service';
import { policyForUpload } from '../moderation/policy';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UploadsService, StoredFile } from '../uploads/uploads.service';
import * as path from 'node:path';
import * as fs from 'node:fs';
import {
  detectUploadImageSignature,
  imageExtensionMatches,
  canonicalImageExtension,
} from '../common/upload-image-signature';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────────────────────
// PROJECT BRANDING UPLOAD BRIDGE
// ─────────────────────────────────────────────────────────────────────────────
// Purpose:
// - Let project owners/admins upload a logo/profile image or banner image.
// - Temporarily stage to local disk for byte validation and moderation.
// - Persist the accepted image to the public R2 bucket (no local fallback).
// - Save the durable R2 URL only after authorization and billing checks.
const PROJECT_BRANDING_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const PROJECT_BRANDING_UPLOAD_DIR = path.join(process.cwd(), 'uploads');

function ensureProjectBrandingUploadDir() {
  fs.mkdirSync(PROJECT_BRANDING_UPLOAD_DIR, { recursive: true });
}

function safeProjectBrandingExtension(originalName = '') {
  const ext = path.extname(originalName || '').toLowerCase();
  return ext && /^[.a-z0-9]+$/.test(ext) ? ext : '.png';
}

const projectBrandingDiskStorage = diskStorage({
  destination: (_req, _file, cb) => {
    ensureProjectBrandingUploadDir();
    cb(null, PROJECT_BRANDING_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = safeProjectBrandingExtension(file.originalname);
    const suffix = Math.random().toString(36).slice(2, 10);
    cb(null, `project-branding-${Date.now()}-${suffix}${ext}`);
  },
});

function projectBrandingFileFilter(
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!file?.mimetype?.startsWith('image/')) {
    cb(new BadRequestException('Only image uploads are allowed for project branding.'), false);
    return;
  }

  cb(null, true);
}

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly projectFollowService: ProjectFollowService,
    private readonly moderationService: ModerationService,
    private readonly imageModerationService: ImageModerationService,
    private readonly uploadsService: UploadsService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────────

  @Post()
  @UseInterceptors(TextModerationInterceptor)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Project created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 per minute
  async create(@Req() req: any, @Body() dto: CreateProjectDto) {
    const userId = req.user?.sub || req.user?.userId;
    this.logger.log(`Creating project: ${dto.name}`);
    const project = await this.projectsService.create(userId, dto);
    return {
      success: true,
      data: project,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get all projects for current user' })
  @ApiQuery({ name: 'status', required: false, enum: ProjectStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @Req() req: any,
    @Query('status') status?: ProjectStatus,
    @Query('search') search?: string,
    @Query('tags') tags?: string | string[],
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const userId = req.user?.sub || req.user?.userId;

    const options: ProjectQueryOptions = {
      status,
      search,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      sortBy,
      sortOrder,
    };

    const result = await this.projectsService.findUserProjects(userId, options);

    return {
      success: true,
      data: result.projects,
      meta: {
        total: result.total,
        limit: options.limit || 50,
        offset: options.offset || 0,
      },
    };
  }

  @Get('starred')
  @ApiOperation({ summary: 'Get starred projects' })
  async findStarred(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    const projects = await this.projectsService.findStarred(userId);
    return {
      success: true,
      data: projects,
    };
  }

  // quiet-projects-endpoint-v1
  @Get('quiet')
  @ApiOperation({
    summary: 'Get projects with no activity for at least 3 days',
  })
  async findQuietProjects(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.projectsService.findQuietProjects(userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // OVERVIEW — MUST BE BEFORE :id
  // ─────────────────────────────────────────────────────────────────────────────

  // unified-project-search-v1
  @Get(':id/search')
  @ApiOperation({
    summary:
      'Search People, Moves, Files, Announcements, and Team Room content in one project',
  })
  @ApiParam({
    name: 'id',
    description: 'Project ID',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
  })
  async searchProjectContent(
    @Req() req: any,
    @Param(
      'id',
      ParseObjectIdPipe,
    )
    id: string,
    @Query('q') query?: string,
    @Query('limit') limit?: string,
  ) {
    const userId =
      req.user?.sub ||
      req.user?.userId;

    const results =
      await this.projectsService
        .searchProjectContent(
          id,
          userId,
          query || '',
          limit
            ? parseInt(
                limit,
                10,
              )
            : 10,
        );

    return {
      success: true,
      data: results,
      meta: {
        query:
          String(
            query || '',
          ).trim(),
        total:
          results.length,
      },
    };
  }


  @Get(':id/overview')
  // project-overview-read-throttle-v1
  @Throttle({
    short: { limit: 60, ttl: 1000 },
    medium: { limit: 180, ttl: 10000 },
    long: { limit: 600, ttl: 60000 },
  })
  @ApiOperation({ summary: 'Get rich overview data for ProjectHome' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Overview data found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async getOverview(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;
    const overview = await this.projectsService.getOverviewData(id, userId);

    if (overview?.project && typeof overview.project.populate === 'function') {
      await overview.project.populate(
        'ownerId',
        'firstName lastName username email avatar profilePicture',
      );
      await overview.project.populate(
        'members.userId',
        'firstName lastName username email avatar profilePicture',
      );
    }

    return {
      success: true,
      data: overview,
    };
  }


  @Get(':id/closure-readiness')
  @ApiOperation({ summary: 'Evaluate whether a project is ready to close' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Closure readiness evaluated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async getClosureReadiness(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const readiness = await this.projectsService.evaluateProjectClosure(id, userId);

    return {
      success: true,
      data: readiness,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async findOne(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;
    const project = await this.projectsService.findByIdWithAccess(id, userId);

    if (project && typeof project.populate === 'function') {
      await project.populate(
        'ownerId',
        'firstName lastName username email avatar profilePicture',
      );
      await project.populate(
        'members.userId',
        'firstName lastName username email avatar profilePicture',
      );
    }

    return {
      success: true,
      data: project,
    };
  }

  @Get(':id/pulse')
  @ApiOperation({ summary: 'Get project Pulse dashboard data' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async getPulse(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;
    const pulseData = await this.projectsService.getPulseData(id, userId);

    if (pulseData && pulseData.project && typeof pulseData.project.populate === 'function') {
      await pulseData.project.populate(
        'ownerId',
        'firstName lastName username email avatar profilePicture',
      );
      await pulseData.project.populate(
        'members.userId',
        'firstName lastName username email avatar profilePicture',
      );
    }

    return {
      success: true,
      data: pulseData,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 3: FOLLOW ENDPOINTS (spectator subscriptions)
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':id/follow')
  @ApiOperation({ summary: 'Follow project updates (spectator subscription)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async followProject(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: FollowProjectDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const follow = await this.projectFollowService.followProject(id, userId, dto);
    return { success: true, data: follow };
  }

  @Patch(':id/follow')
  @ApiOperation({ summary: 'Update follow preferences' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async updateFollowPrefs(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateFollowPrefsDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    const updated = await this.projectFollowService.followProject(id, userId, dto as any);
    return { success: true, data: updated };
  }

  @Delete(':id/follow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfollow project updates' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async unfollowProject(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const result = await this.projectFollowService.unfollowProject(id, userId);
    return { success: true, data: result };
  }

  @Get(':id/follow-status')
  @ApiOperation({ summary: 'Get follow status for current user' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async followStatus(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const status = await this.projectFollowService.getFollowStatus(id, userId);
    return { success: true, data: status };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PROJECT BRANDING IMAGE UPLOAD
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':id/branding-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: projectBrandingDiskStorage,
      fileFilter: projectBrandingFileFilter,
      limits: { fileSize: PROJECT_BRANDING_MAX_FILE_SIZE },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a project logo or banner image' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        kind: {
          type: 'string',
          enum: ['logo', 'banner'],
          default: 'logo',
        },
      },
    },
  })
  async uploadBrandingImage(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('kind') kind?: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    // Multer has already created the temporary file when this method runs.
    // Clean it on EVERY exit path, including unauthorized requests and R2 errors.
    const cleanupTempFile = async () => {
      if (!file.path) return;
      try {
        await fs.promises.unlink(file.path);
      } catch (error: any) {
        if (error?.code !== 'ENOENT') {
          this.logger.warn('Could not clean temporary branding upload');
        }
      }
    };

    try {
      const normalizedKind = String(kind || 'logo').toLowerCase();
      if (normalizedKind !== 'logo' && normalizedKind !== 'banner') {
        throw new BadRequestException('Branding kind must be logo or banner');
      }

      await this.projectsService.assertProjectEditableByUser(id, userId);
      // Fail before moderation/R2 when the workspace is billing read-only.
      // updateProjectBranding checks again before committing the pointer.
      await this.projectsService.assertProjectWritableForBilling(id);
      if (!this.uploadsService.isPublicStorageEnabled()) {
        throw new ServiceUnavailableException(
          'Project branding storage is unavailable. Existing branding was not changed.',
        );
      }

      // The initial Multer filter only checks the client-supplied MIME type.
      // The detected bytes remain authoritative; reject SVG and HTML uploads.
      const detectedImageMime = await detectUploadImageSignature(file.path);
      if (!detectedImageMime) {
        throw new BadRequestException(
          'Project branding must be a JPG, PNG, GIF, WebP, AVIF, BMP, or TIFF image.',
        );
      }

      const storedExt = path.extname(file.filename || '').slice(1).toLowerCase();
      if (!imageExtensionMatches(storedExt, detectedImageMime)) {
        const canonicalExt = canonicalImageExtension(detectedImageMime) || 'png';
        const baseName = path.basename(file.filename, path.extname(file.filename));
        const renamedFilename = `${baseName}.${canonicalExt}`;
        const renamedPath = path.join(path.dirname(file.path), renamedFilename);
        try {
          await fs.promises.rename(file.path, renamedPath);
        } catch {
          throw new BadRequestException('This branding image could not be stored.');
        }
        file.path = renamedPath;
        file.filename = renamedFilename;
      }
      file.mimetype = detectedImageMime;

      // Retain R53 scanning, AI moderation, decision logging, and policy.
      const brandingExt = path.extname(file.filename || '').slice(1).toLowerCase();
      const brandingSize = Number(file.size || 0);
      const virus = await this.moderationService.virusScan(file.path);
      const imgResult = await this.imageModerationService.moderateImage(file.path);

      if (imgResult.action === 'block') {
        throw new BadRequestException(
          imgResult.reason || 'This branding image is not allowed.',
        );
      }
      const image = {
        decision: (
          imgResult.action === 'allow' ? 'ALLOW' :
          imgResult.action === 'review' ? 'REVIEW' : 'BLOCK'
        ) as ModerationDecision,
        reason: imgResult.reason,
        categories: imgResult.labels.map((label) => label.name) as ModerationCategory[],
      };
      const decision = policyForUpload({
        ext: brandingExt,
        sizeBytes: brandingSize,
        mime: detectedImageMime,
        virus,
        image,
      });
      await this.moderationService.logDecision({
        kind: 'image',
        projectId: id,
        userId,
        ext: brandingExt,
        size: brandingSize,
        mime: detectedImageMime,
        decision: decision.decision,
        reason: decision.reason,
        meta: { surface: 'project-branding', brandingKind: normalizedKind },
        ts: Date.now(),
      });
      if (decision.decision === 'BLOCK') {
        throw new BadRequestException(
          decision.reason || 'This branding image is not allowed.',
        );
      }
      if (decision.decision === 'REVIEW') {
        throw new BadRequestException(
          decision.reason || 'This branding image needs review and cannot be used yet.',
        );
      }

      // Upload first, then persist the pointer. Never overwrite the old pointer
      // before R2 acknowledges persistence. If the MongoDB update fails, remove
      // only the newly-created R2 object, not the previously referenced image.
      const stored: StoredFile = await this.uploadsService.uploadProjectBranding(
        file,
        id,
        normalizedKind,
      );
      let project;
      try {
        project = await this.projectsService.updateProjectBranding(
          id,
          userId,
          normalizedKind,
          stored.url,
        );
      } catch (error) {
        // A failed/uncertain database response might occur after the write
        // persisted. Never delete an object if the project already points to it.
        // When the database is unreachable, leave the object for reconciliation.
        let safeToDelete = false;
        try {
          safeToDelete = !(await this.projectsService.isProjectBrandingUrlCurrent(
            id, normalizedKind, stored.url,
          ));
        } catch {
          this.logger.warn('R54 could not confirm branding rollback safety');
        }
        if (safeToDelete) {
          try {
            await this.uploadsService.deleteStoredObject({
              storageProvider: stored.storageProvider,
              storageKey: stored.storageKey,
              storageBucket: stored.storageBucket,
              url: stored.url,
            });
          } catch {
            this.logger.error('R54 failed to roll back newly uploaded branding object');
          }
        }
        throw error;
      }

      return {
        success: true,
        data: { kind: normalizedKind, url: stored.url, project },
      };
    } finally {
      await cleanupTempFile();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────────────────────

  @Put(':id')
  @UseInterceptors(TextModerationInterceptor)
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async update(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const project = await this.projectsService.update(id, userId, dto);
    return {
      success: true,
      data: project,
    };
  }

  @Patch(':id/star')
  @ApiOperation({ summary: 'Toggle project starred status' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async toggleStar(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;

    const updated =
      await this.projectsService
        .toggleStar(
          id,
          userId,
        );

    return {
      success: true,
      data: { isStarred: updated.isStarred },
    };
  }



  @Post(':id/ships')
  @ApiOperation({ summary: 'Record a lightweight project ship update' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async recordShipUpdate(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: { title?: string; description?: string; projectName?: string },
  ) {
    const userId = req.user?.sub || req.user?.userId;

    const shipTitle =
      String(body?.title || body?.description || 'Home mission shipped').trim() ||
      'Home mission shipped';

    const result = await this.projectsService.recordShipUpdate({
      projectId: id,
      userId,
      shipTitle,
      projectNameOverride: body?.projectName,
    });

    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a project through the closeout flow' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project completed successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Project not ready to close' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async completeProject(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() payload: CompleteProjectPayload,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const project = await this.projectsService.completeProject(id, userId, payload);

    return {
      success: true,
      data: project,
    };
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen a completed project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project reopened successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid reopen request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async reopenProject(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() payload: ReopenProjectPayload,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const project = await this.projectsService.reopenProject(id, userId, payload);

    return {
      success: true,
      data: project,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ARCHIVE / DELETE
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async archive(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;
    const project = await this.projectsService.archive(id, userId);
    return {
      success: true,
      data: project,
    };
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore an archived project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project restored successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async restore(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;
    const project = await this.projectsService.restoreArchivedProject(id, userId);
    return {
      success: true,
      data: project,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Project deleted' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Only owner can delete' })
  async delete(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;
    await this.projectsService.delete(id, userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MEMBERS
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async addMember(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: AddMemberDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const project = await this.projectsService.addMember(id, userId, dto);
    return {
      success: true,
      data: project,
    };
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a member from project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove' })
  async removeMember(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('userId', ParseObjectIdPipe) memberUserId: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const project = await this.projectsService.removeMember(id, userId, memberUserId);
    return {
      success: true,
      data: project,
    };
  }

  @Patch(':id/members/:userId/role')
  @ApiOperation({ summary: 'Update member permission role' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'userId', description: 'User ID to update' })
  async updateMemberRole(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('userId', ParseObjectIdPipe) memberUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    const project = await this.projectsService.updateMemberRole(
      id,
      userId,
      memberUserId,
      dto,
    );

    return {
      success: true,
      data: project,
    };
  }

  @Patch(':id/members/:userId/display-role')
  @ApiOperation({ summary: 'Update member display role label' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'userId', description: 'User ID to update' })
  async updateMemberDisplayRole(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('userId', ParseObjectIdPipe) memberUserId: string,
    @Body('displayRole') displayRole: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    const project = await this.projectsService.updateMemberDisplayRole(
      id,
      userId,
      memberUserId,
      displayRole,
    );

    return {
      success: true,
      data: project,
    };
  }

  @Get(':id/preferences')
  @ApiOperation({ summary: 'Get the current user notification preferences for a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async getPreferences(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const preferences = await this.projectsService.getMemberPreferences(id, userId);

    return {
      success: true,
      data: preferences,
    };
  }

  @Patch(':id/preferences')
  @ApiOperation({ summary: 'Update user-specific notification preferences for a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async updatePreferences(
    @Req() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() preferences: UpdateProjectPreferencesDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const project = await this.projectsService.updateMemberPreferences(id, userId, preferences);
    return {
      success: true,
      data: project,
    };
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async leaveProject(@Req() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    const userId = req.user?.sub || req.user?.userId;
    await this.projectsService.leaveProject(id, userId);
    return {
      success: true,
      message: 'Successfully left the project',
    };
  }
}
