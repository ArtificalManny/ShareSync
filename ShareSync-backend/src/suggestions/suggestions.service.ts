import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Suggestion, SuggestionDocument } from './schemas/suggestion.schema';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class SuggestionsService {
  constructor(
    @InjectModel(Suggestion.name) private suggestionModel: Model<SuggestionDocument>,
    @InjectModel('Project') private projectModel: Model<any>,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // openshare-suggestions-member-access-v1
  private async getSuggestionMembershipPrivileges(
    projectId: string,
    userId: string,
    project: any,
  ): Promise<{
    isOwner: boolean;
    isMember: boolean;
    isAdmin: boolean;
  }> {
    const isOwner =
      project?.ownerId?.toString() ===
      userId;

    if (isOwner) {
      return {
        isOwner: true,
        isMember: true,
        isAdmin: true,
      };
    }

    const member =
      Array.isArray(
        project?.members,
      )
        ? project.members.find(
            (candidate: any) =>
              (
                candidate?.userId?._id?.toString() ||
                candidate?.userId?.toString()
              ) === userId,
          )
        : undefined;

    /*
     * Ordinary authenticated outsider.
     *
     * Preserve existing Suggestions behavior exactly.
     */
    if (!member) {
      return {
        isOwner: false,
        isMember: false,
        isAdmin: false,
      };
    }

    /*
     * Durable Project.members is preserved.
     *
     * Billing only determines whether this accepted member currently receives
     * member-level privileges after downgrade restriction.
     */
    const billingAccess =
      await this.subscriptionsService
        .getProjectMemberAccess(
          projectId,
          userId,
        );

    const isMember =
      billingAccess.active;

    const isAdmin =
      isMember &&
      member.role === 'admin';

    return {
      isOwner: false,
      isMember,
      isAdmin,
    };
  }

  // openshare-suggestions-ordinary-access-v1
  //
  // Ordinary project authorization, independent from billing.
  //
  // A durable owner/member remains an ordinary project participant even if
  // downgrade billing temporarily makes that member inactive for mutations.
  //
  // Public spectators may interact only when the project explicitly enables
  // Suggestions mode. Following a project is not an authorization requirement.
  private getSuggestionOrdinaryAccess(
    project: any,
    userId: string,
  ): {
    isOwner: boolean;
    isMember: boolean;
    isAdmin: boolean;
    isPublic: boolean;
    suggestionsEnabled: boolean;
  } {
    const normalizeId =
      (value: any): string => {
        const resolved =
          value?._id ??
          value?.id ??
          value;

        return resolved
          ? String(resolved)
          : '';
      };

    const normalizedUserId =
      normalizeId(
        userId,
      );

    const ownerRefs = [
      project?.ownerId,
      project?.owner,
      project?.createdBy,
      project?.createdById,
      project?.creatorId,
      project?.userId,
    ];

    const isOwner =
      ownerRefs.some(
        (value: any) =>
          normalizeId(value) ===
          normalizedUserId,
      );

    const members =
      Array.isArray(
        project?.members,
      )
        ? project.members
        : [];

    const member =
      members.find(
        (candidate: any) => {
          const candidateId =
            normalizeId(
              candidate?.userId ??
              candidate?.user ??
              candidate?.memberId ??
              candidate?._id ??
              candidate?.id ??
              candidate,
            );

          return (
            candidateId ===
            normalizedUserId
          );
        },
      );

    const isMember =
      isOwner ||
      Boolean(member);

    const isAdmin =
      isOwner ||
      (
        Boolean(member) &&
        String(
          member?.role ||
          '',
        ).toLowerCase() ===
          'admin'
      );

    const status =
      String(
        project?.status ||
        '',
      )
        .trim()
        .toLowerCase();

    const archived =
      project?.isArchived === true ||
      status === 'archived' ||
      status === 'deleted';

    const visibility =
      String(
        project?.visibility ||
        project?.privacy ||
        '',
      )
        .trim()
        .toLowerCase();

    const settings =
      project?.settings &&
      typeof project.settings ===
        'object'
        ? project.settings
        : {};

    const isPublic =
      !archived &&
      (
        visibility === 'public' ||
        visibility === 'listed' ||
        project?.isPublic === true ||
        project?.public === true ||
        settings?.isPublic === true
      );

    const publicAccessMode =
      String(
        project?.publicAccessMode ||
        project?.spectatorMode ||
        settings?.publicAccessMode ||
        settings?.spectatorMode ||
        '',
      )
        .trim()
        .toLowerCase();

    const suggestionsEnabled =
      isPublic &&
      (
        publicAccessMode ===
          'suggest' ||
        publicAccessMode ===
          'suggestions' ||
        project?.suggestionsEnabled ===
          true ||
        settings?.suggestionsEnabled ===
          true
      );

    return {
      isOwner,
      isMember,
      isAdmin,
      isPublic,
      suggestionsEnabled,
    };
  }

  // openshare-suggestions-billing-write-v1
  //
  // Billing overlay only.
  //
  // Ordinary Suggestions authorization remains responsible for deciding
  // whether an actor may create, edit, moderate, delete, comment, or upvote.
  //
  // Public spectators are not workspace members, so member-overage billing
  // must not classify them as inactive collaborators. Durable project members,
  // however, must remain billing-active after downgrade restriction.
  private async assertSuggestionMutationAllowedForBilling(
    projectId: string,
    userId: string,
    project: any,
  ): Promise<void> {
    const projectAccess =
      await this.subscriptionsService
        .getProjectWriteAccess(
          projectId,
        );

    if (!projectAccess.writable) {
      const selectionRequired =
        projectAccess.reason ===
        'billing_selection_required';

      throw new ForbiddenException({
        code:
          'BILLING_PROJECT_READ_ONLY',

        reason:
          projectAccess.reason,

        message:
          selectionRequired
            ? 'This project is temporarily read-only until the workspace owner finishes choosing which projects to keep active on the Free plan.'
            : 'This project is read-only under the workspace owner current plan. The project owner can change the retained-project selection or upgrade to restore write access.',

        projectId,

        ownerUserId:
          projectAccess.ownerUserId,

        downgradeState:
          projectAccess.downgradeState,

        projectLimit:
          projectAccess.projectLimit,

        ownedProjectCount:
          projectAccess.ownedProjectCount,

        overProjectLimit:
          projectAccess.overProjectLimit,

        retainedProject:
          projectAccess.retainedProject,

        selectionRequired:
          projectAccess.selectionRequired,
      });
    }

    const isOwner =
      project?.ownerId?.toString() ===
      userId;

    if (isOwner) {
      return;
    }

    const durableMember =
      Array.isArray(
        project?.members,
      )
        ? project.members.find(
            (candidate: any) =>
              (
                candidate?.userId?._id?.toString() ||
                candidate?.userId?.toString()
              ) === userId,
          )
        : undefined;

    /*
     * Genuine outsider / public spectator.
     *
     * Ordinary Suggestions authorization handles whether this outsider is
     * actually permitted to perform a spectator action.
     */
    if (!durableMember) {
      return;
    }

    const memberAccess =
      await this.subscriptionsService
        .getProjectMemberAccess(
          projectId,
          userId,
        );

    if (!memberAccess.active) {
      const selectionRequired =
        memberAccess.reason ===
        'billing_member_selection_required';

      throw new ForbiddenException({
        code:
          'BILLING_MEMBER_INACTIVE',

        reason:
          memberAccess.reason,

        message:
          selectionRequired
            ? 'Your workspace membership is temporarily inactive until the workspace owner finishes choosing which members to keep active on the Free plan.'
            : 'Your workspace membership is inactive under the workspace owner current plan. The workspace owner can change the retained-member selection or upgrade to restore access.',

        projectId,

        ownerUserId:
          memberAccess.ownerUserId,

        downgradeState:
          memberAccess.downgradeState,

        memberLimit:
          memberAccess.memberLimit,

        acceptedWorkspaceMemberCount:
          memberAccess.acceptedWorkspaceMemberCount,

        overMemberLimit:
          memberAccess.overMemberLimit,

        retainedMember:
          memberAccess.retainedMember,

        selectionRequired:
          memberAccess.selectionRequired,
      });
    }
  }

  async create(projectId: string, userId: string, createDto: CreateSuggestionDto): Promise<Suggestion> {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    const ordinaryAccess =
      this.getSuggestionOrdinaryAccess(
        project,
        userId,
      );

    const {
      isMember,
      isPublic,
      suggestionsEnabled,
    } = ordinaryAccess;

    if (
      !isMember &&
      (
        !isPublic ||
        !suggestionsEnabled
      )
    ) {
      throw new ForbiddenException(
        'Suggestions are not enabled for spectators on this project.',
      );
    }

    await this
      .assertSuggestionMutationAllowedForBilling(
        projectId,
        userId,
        project,
      );

    const initialVisibility =
      isMember
        ? 'internal'
        : 'draft';
    const newSuggestion = new this.suggestionModel({
      ...createDto, projectId, authorId: userId, visibility: initialVisibility, status: 'open',
    });
    return newSuggestion.save();
  }

  async findAllForProject(projectId: string, userId: string): Promise<Suggestion[]> {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    const ordinaryAccess =
      this.getSuggestionOrdinaryAccess(
        project,
        userId,
      );

    const {
      isOwner,
      isMember,
      isPublic,
    } = ordinaryAccess;

    if (
      !isOwner &&
      !isMember &&
      !isPublic
    ) {
      throw new ForbiddenException(
        'You do not have access to this project Suggestions feed.',
      );
    }

    if (isOwner || isMember) {
      return this.suggestionModel.find({
        projectId, visibility: { $in: ['draft', 'internal', 'public'] }
      }).sort({ createdAt: -1 }).populate('authorId', 'firstName lastName avatarUrl').exec();
    }
    return this.suggestionModel.find({
      projectId, $or: [{ visibility: 'public' }, { authorId: userId }]
    }).sort({ createdAt: -1 }).exec();
  }

  async update(projectId: string, suggestionId: string, userId: string, updateDto: UpdateSuggestionDto): Promise<Suggestion> {
    const project = await this.projectModel.findById(projectId);
    const suggestion = await this.suggestionModel.findOne({ _id: suggestionId, projectId });
    if (!project || !suggestion) throw new NotFoundException('Suggestion or Project not found');
    const ordinaryAccess =
      this.getSuggestionOrdinaryAccess(
        project,
        userId,
      );

    const {
      isMember,
      isAdmin,
      suggestionsEnabled,
    } = ordinaryAccess;

    if (
      !isMember &&
      !suggestionsEnabled
    ) {
      throw new ForbiddenException(
        'Suggestions are not enabled for spectators on this project.',
      );
    }

    if ((updateDto.visibility || updateDto.status) && !isAdmin) {
      throw new ForbiddenException('Only project moderators can publish or update status.');
    }
    if (!isAdmin && suggestion.authorId.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own suggestions.');
    }
    await this
      .assertSuggestionMutationAllowedForBilling(
        projectId,
        userId,
        project,
      );

    Object.assign(suggestion, updateDto);
    return suggestion.save();
  }

  async remove(projectId: string, suggestionId: string, userId: string): Promise<void> {
    const project = await this.projectModel.findById(projectId);
    const suggestion = await this.suggestionModel.findOne({ _id: suggestionId, projectId });
    if (!project || !suggestion) throw new NotFoundException('Suggestion not found');
    const ordinaryAccess =
      this.getSuggestionOrdinaryAccess(
        project,
        userId,
      );

    const {
      isMember,
      isAdmin,
      suggestionsEnabled,
    } = ordinaryAccess;

    if (
      !isMember &&
      !suggestionsEnabled
    ) {
      throw new ForbiddenException(
        'Suggestions are not enabled for spectators on this project.',
      );
    }

    if (!isAdmin && suggestion.authorId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own suggestions.');
    }
    await this
      .assertSuggestionMutationAllowedForBilling(
        projectId,
        userId,
        project,
      );

    await this.suggestionModel.deleteOne({ _id: suggestionId });
  }

  async toggleUpvote(projectId: string, suggestionId: string, userId: string): Promise<{ upvotes: string[]; voted: boolean; count: number }> {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    const suggestion = await this.suggestionModel.findOne({ _id: suggestionId, projectId });
    if (!suggestion) throw new NotFoundException('Suggestion not found');

    const ordinaryAccess =
      this.getSuggestionOrdinaryAccess(
        project,
        userId,
      );

    const {
      isMember,
      suggestionsEnabled,
    } = ordinaryAccess;

    if (
      !isMember &&
      !suggestionsEnabled
    ) {
      throw new ForbiddenException(
        'Suggestions interactions are not enabled for spectators on this project.',
      );
    }

    if (
      !isMember &&
      suggestion.visibility !== 'public'
    ) {
      throw new ForbiddenException(
        'You do not have access to interact with this suggestion.',
      );
    }

    await this
      .assertSuggestionMutationAllowedForBilling(
        projectId,
        userId,
        project,
      );

    if (!Array.isArray(suggestion.upvotes)) {
      suggestion.upvotes = [];
    }

    const idx = suggestion.upvotes.findIndex((id: any) => id?.toString() === userId);
    let voted: boolean;

    if (idx >= 0) {
      suggestion.upvotes.splice(idx, 1);
      voted = false;
    } else {
      suggestion.upvotes.push(new Types.ObjectId(userId) as any);
      voted = true;
    }

    await suggestion.save();

    const upvotes = suggestion.upvotes.map((id: any) => id?.toString());

    return {
      upvotes,
      voted,
      count: upvotes.length,
    };
  }

  async addComment(suggestionId: string, userId: string, content: string, authorName?: string): Promise<any> {
    const suggestion = await this.suggestionModel.findById(suggestionId);
    if (!suggestion) throw new NotFoundException('Suggestion not found');
    const projectId =
      suggestion.projectId?.toString();

    if (!projectId) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    const project =
      await this.projectModel.findById(
        projectId,
      );

    if (!project) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    const ordinaryAccess =
      this.getSuggestionOrdinaryAccess(
        project,
        userId,
      );

    const {
      isMember,
      suggestionsEnabled,
    } = ordinaryAccess;

    if (
      !isMember &&
      !suggestionsEnabled
    ) {
      throw new ForbiddenException(
        'Suggestions interactions are not enabled for spectators on this project.',
      );
    }

    if (
      !isMember &&
      suggestion.visibility !== 'public' &&
      suggestion.authorId?.toString() !== userId
    ) {
      throw new ForbiddenException(
        'You do not have access to comment on this suggestion.',
      );
    }

    await this
      .assertSuggestionMutationAllowedForBilling(
        projectId,
        userId,
        project,
      );

    const comment = {
      authorId: new Types.ObjectId(userId),
      authorName: authorName || '',
      content,
      createdAt: new Date(),
    };
    suggestion.comments.push(comment as any);
    await suggestion.save();
    return suggestion.comments[suggestion.comments.length - 1];
  }

  async getComments(suggestionId: string): Promise<any[]> {
    const suggestion = await this.suggestionModel.findById(suggestionId);
    if (!suggestion) throw new NotFoundException('Suggestion not found');
    return suggestion.comments || [];
  }
}
