#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/follows/follows.controller.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[harden_follows_controller] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


NEW_CONTENT = """// src/follows/follows.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// FOLLOWS CONTROLLER - REST API for Instagram-style project following
//
// POST   /api/follows/:projectId         → Follow a project
// DELETE /api/follows/:projectId         → Unfollow a project
// GET    /api/follows                    → List all followed projects (full data)
// GET    /api/follows/check/:projectId   → Check if following one project
// GET    /api/follows/status?ids=a,b,c   → Bulk check follow status
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Req,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Follows')
@Controller('follows')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  private getRequestUserId(req: any): string {
    const userId =
      req.user?.sub ||
      req.user?.userId ||
      req.user?.id ||
      req.user?._id;

    const normalized = String(userId || '').trim();

    if (!normalized || normalized === 'undefined' || normalized === 'null') {
      throw new BadRequestException('Missing authenticated user id');
    }

    return normalized;
  }

  private normalizeProjectId(projectId: string): string {
    const normalized = String(projectId || '').trim();

    if (!normalized || normalized === 'undefined' || normalized === 'null') {
      throw new BadRequestException('Missing valid projectId');
    }

    return normalized;
  }

  private parseProjectIds(ids: string): string[] {
    return Array.from(
      new Set(
        String(ids || '')
          .split(',')
          .map((id) => id.trim())
          .filter((id) => id && id !== 'undefined' && id !== 'null'),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FOLLOW a project
  // ─────────────────────────────────────────────────────────────────────────────
  @Post(':projectId')
  @ApiOperation({ summary: 'Follow a project' })
  @ApiParam({ name: 'projectId', type: String })
  async follow(@Req() req: any, @Param('projectId') projectId: string) {
    const userId = this.getRequestUserId(req);
    const normalizedProjectId = this.normalizeProjectId(projectId);

    return this.followsService.follow(userId, normalizedProjectId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UNFOLLOW a project
  // ─────────────────────────────────────────────────────────────────────────────
  @Delete(':projectId')
  @ApiOperation({ summary: 'Unfollow a project' })
  @ApiParam({ name: 'projectId', type: String })
  async unfollow(@Req() req: any, @Param('projectId') projectId: string) {
    const userId = this.getRequestUserId(req);
    const normalizedProjectId = this.normalizeProjectId(projectId);

    return this.followsService.unfollow(userId, normalizedProjectId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LIST all followed projects (full project data for Projects page)
  // ─────────────────────────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Get all followed projects with full data' })
  async getFollowed(@Req() req: any) {
    const userId = this.getRequestUserId(req);
    const projects = await this.followsService.getFollowedProjects(userId);

    return { success: true, data: projects };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BULK STATUS CHECK (for Discover feed — check many projects at once)
  // GET /api/follows/status?ids=id1,id2,id3
  // ─────────────────────────────────────────────────────────────────────────────
  @Get('status')
  @ApiOperation({ summary: 'Bulk check follow status for multiple projects' })
  @ApiQuery({
    name: 'ids',
    required: true,
    type: String,
    description: 'Comma-separated project IDs',
  })
  async getBulkStatus(@Req() req: any, @Query('ids') ids: string) {
    const userId = this.getRequestUserId(req);
    const projectIds = this.parseProjectIds(ids);

    if (projectIds.length === 0) {
      return { success: true, statuses: {} };
    }

    const statuses = await this.followsService.getFollowStatusBulk(
      userId,
      projectIds,
    );

    return { success: true, statuses };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SINGLE STATUS CHECK
  // GET /api/follows/check/:projectId
  // NOTE: This route MUST be registered AFTER /status to avoid conflicts
  // ─────────────────────────────────────────────────────────────────────────────
  @Get('check/:projectId')
  @ApiOperation({ summary: 'Check if following a specific project' })
  @ApiParam({ name: 'projectId', type: String })
  async getStatus(
    @Req() req: any,
    @Param('projectId') projectId: string,
  ) {
    const userId = this.getRequestUserId(req);
    const normalizedProjectId = this.normalizeProjectId(projectId);
    const following = await this.followsService.isFollowing(
      userId,
      normalizedProjectId,
    );

    return { success: true, following };
  }
}
"""


def main():
    print("[harden_follows_controller] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    original = TARGET.read_text(encoding="utf-8")

    required_markers = [
        "export class FollowsController",
        "@Post(':projectId')",
        "@Delete(':projectId')",
        "@Get()",
        "@Get('status')",
        "@Get('check/:projectId')",
        "this.followsService.follow(userId, projectId)",
        "this.followsService.unfollow(userId, projectId)",
        "this.followsService.getFollowedProjects(userId)",
        "this.followsService.getFollowStatusBulk(",
        "this.followsService.isFollowing(userId, projectId)",
    ]

    for marker in required_markers:
        if marker not in original:
            fail(f"Missing expected marker before rewrite: {marker}")

    required_after = [
        "BadRequestException",
        "private getRequestUserId(req: any): string",
        "private normalizeProjectId(projectId: string): string",
        "private parseProjectIds(ids: string): string[]",
        "const normalizedProjectId = this.normalizeProjectId(projectId);",
        "return this.followsService.follow(userId, normalizedProjectId);",
        "return this.followsService.unfollow(userId, normalizedProjectId);",
        "const projectIds = this.parseProjectIds(ids);",
        "this.followsService.isFollowing(",
    ]

    for marker in required_after:
        if marker not in NEW_CONTENT:
            fail(f"Internal safety check failed. Missing marker in new content: {marker}")

    if original == NEW_CONTENT:
        print("[harden_follows_controller] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-harden-follows-controller-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[harden_follows_controller] backup created: {backup}")

    TARGET.write_text(NEW_CONTENT, encoding="utf-8")
    print(f"[harden_follows_controller] patched: {TARGET}")

    print("")
    print("[harden_follows_controller] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"BadRequestException|getRequestUserId|normalizeProjectId|parseProjectIds|follow\\(|unfollow\\(|getBulkStatus|getStatus|followsService\" src/follows/follows.controller.ts -C 8")
    print("  git diff -- src/follows/follows.controller.ts")


if __name__ == "__main__":
    main()
