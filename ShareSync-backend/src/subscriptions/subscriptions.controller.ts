// src/subscriptions/subscriptions.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTIONS CONTROLLER - REST API for subscription management
// Phase 5: Stripe integration endpoints (Stripe optional until configured)
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  Headers,
  RawBodyRequest,
  BadRequestException,
  Logger,
  HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionsService, PLAN_CONFIGS } from './subscriptions.service';
import { VaultFile } from '../vault/schemas/vault-file.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateCheckoutDto,
  UpdateBudgetCapDto,
  UpdateBillingDetailsDto,
} from './dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    @InjectModel('Project') private readonly projectModel: Model<any>,
    @InjectModel(VaultFile.name) private readonly vaultFileModel: Model<any>,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // GET CURRENT SUBSCRIPTION
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription' })
  @ApiResponse({ status: 200, description: 'Returns current subscription' })
  async getCurrentSubscription(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    const subscription = await this.subscriptionsService.getOrCreateSubscription(userId);

    // SUBSCRIPTION USAGE REALTIME BRIDGE
    // ACTIVE PROJECT USAGE COUNT BRIDGE
    // Count active operating projects only. Completed and archived projects
    // remain visible but do not consume free-plan project capacity.
    // Projects and storage are derived from live records so the Navbar usage pill
    // does not depend on stale subscription.usage snapshots.
    const oid = new Types.ObjectId(userId);
    const inactiveProjectStatuses = [
      'completed',
      'done',
      'archived',
      'deleted',
      'COMPLETED',
      'DONE',
      'ARCHIVED',
      'DELETED',
    ];

    const projectAccessQuery = {
      $and: [
        {
          $or: [
            { ownerId: oid },
            { owner: oid },
            { 'members.userId': oid },
            { 'members.user': oid },
          ],
        },
        {
          $or: [
            { completedAt: { $exists: false } },
            { completedAt: null },
          ],
        },
      ],
      isArchived: { $ne: true },
      status: { $nin: inactiveProjectStatuses },
    };

    const realProjectIds = await this.projectModel.distinct('_id', projectAccessQuery);
    const realProjects = realProjectIds.length
      ? await this.projectModel
          .find({ _id: { $in: realProjectIds } })
          .select('_id owner ownerId createdBy members')
          .lean()
      : [];
    const realProjectCount = realProjectIds.length;

    const storageRows = realProjectIds.length
      ? await this.vaultFileModel.aggregate([
          { $match: { projectId: { $in: realProjectIds } } },
          {
            $group: {
              _id: null,
              totalBytes: {
                $sum: {
                  $ifNull: ['$sizeInBytes', { $ifNull: ['$size', 0] }],
                },
              },
            },
          },
        ])
      : [];

    const realStorageBytes = storageRows?.[0]?.totalBytes || 0;

    const normalizeMemberIdentity = (value: any): string | null => {
      if (!value) return null;

      if (typeof value === 'string') {
        return value.includes('@') ? value.toLowerCase() : value;
      }

      if (value instanceof Types.ObjectId) {
        return value.toString();
      }

      if (value._id) return normalizeMemberIdentity(value._id);
      if (value.userId) return normalizeMemberIdentity(value.userId);
      if (value.user) return normalizeMemberIdentity(value.user);
      if (value.email) return String(value.email).toLowerCase();

      if (typeof value.toString === 'function') {
        const rendered = value.toString();
        return rendered && rendered !== '[object Object]' ? rendered : null;
      }

      return null;
    };

    const getProjectMemberCount = (project: any): number => {
      const ids = new Set<string>();

      const ownerId = normalizeMemberIdentity(
        project.ownerId ?? project.owner ?? project.createdBy,
      );

      if (ownerId) ids.add(ownerId);

      for (const member of project.members || []) {
        const memberId = normalizeMemberIdentity(
          member?.userId ??
            member?.user ??
            member?._id ??
            member?.email ??
            member,
        );

        if (memberId) ids.add(memberId);
      }

      return ids.size;
    };

    const realMaxMembersInProject = realProjects.length
      ? Math.max(...realProjects.map(getProjectMemberCount))
      : 0;

    const baseUsage = JSON.parse(JSON.stringify(subscription.usage || {}));

    return {
      success: true,
      data: {
        plan: subscription.plan,
        status: subscription.status,
        billingInterval: subscription.billingInterval,
        usage: {
          ...baseUsage,
          projects: realProjectCount,
          storage: realStorageBytes,
          storageBytes: realStorageBytes,
          storageUsedBytes: realStorageBytes,
          aiCalls: baseUsage.aiCalls || 0,
          aiCallsThisMonth: baseUsage.aiCallsThisMonth || 0,
          membersPerProject: realMaxMembersInProject,
          maxMembersInProject: realMaxMembersInProject,
          activeMembers: realMaxMembersInProject,
        },
        limits: subscription.limits,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAt: subscription.cancelAt,
        budgetCapCents: subscription.budgetCapCents,
        budgetCapEnabled: subscription.budgetCapEnabled,
        activeMembers: subscription.activeMembers,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET USAGE
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current usage and limits' })
  async getUsage(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    const usageData = await this.subscriptionsService.getUsageAndLimits(userId);

    return {
      success: true,
      data: usageData,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET PLANS
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('plans')
  @ApiOperation({ summary: 'Get all available plans' })
  async getPlans() {
    return {
      success: true,
      data: PLAN_CONFIGS,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE CHECKOUT SESSION
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  @ApiResponse({ status: 200, description: 'Returns checkout URL' })
  async createCheckout(
    @Req() req: any,
    @Body() dto: CreateCheckoutDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const result = await this.subscriptionsService.createCheckoutSession(userId, dto);

    return {
      success: true,
      data: result,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE PORTAL SESSION
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe billing portal session' })
  @ApiResponse({ status: 200, description: 'Returns portal URL' })
  async createPortal(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    const result = await this.subscriptionsService.createPortalSession(userId);

    return {
      success: true,
      data: result,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CANCEL SUBSCRIPTION
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription at period end' })
  async cancelSubscription(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    const result = await this.subscriptionsService.cancelSubscription(userId);

    return {
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      data: result,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RESUME SUBSCRIPTION
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('resume')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resume canceled subscription' })
  async resumeSubscription(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    await this.subscriptionsService.resumeSubscription(userId);

    return {
      success: true,
      message: 'Subscription resumed',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE BUDGET CAP
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch('budget-cap')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update budget cap settings' })
  async updateBudgetCap(
    @Req() req: any,
    @Body() dto: UpdateBudgetCapDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    await this.subscriptionsService.updateBudgetCap(userId, dto);

    return {
      success: true,
      message: 'Budget cap updated',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE BILLING DETAILS
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch('billing-details')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update billing details' })
  async updateBillingDetails(
    @Req() req: any,
    @Body() dto: UpdateBillingDetailsDto,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    await this.subscriptionsService.updateBillingDetails(userId, dto);

    return {
      success: true,
      message: 'Billing details updated',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STRIPE WEBHOOK
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    // Delegate to service which handles Stripe availability check
    const result = await this.subscriptionsService.handleWebhookRequest(
      req.rawBody,
      signature,
    );

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHECK LIMIT (internal API for other services)
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('check-limit/:resource')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if resource limit allows action' })
  async checkLimit(
    @Req() req: any,
    @Param('resource') resource: 'projects' | 'storage' | 'aiCalls',
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const result = await this.subscriptionsService.checkLimit(userId, resource);

    return {
      success: true,
      data: result,
    };
  }
}
