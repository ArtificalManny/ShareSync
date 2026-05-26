import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Suggestion, SuggestionDocument } from './schemas/suggestion.schema';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';

@Injectable()
export class SuggestionsService {
  constructor(
    @InjectModel(Suggestion.name) private suggestionModel: Model<SuggestionDocument>,
    @InjectModel('Project') private projectModel: Model<any>,
  ) {}

  async create(projectId: string, userId: string, createDto: CreateSuggestionDto): Promise<Suggestion> {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    const isOwner = project.ownerId?.toString() === userId;
    const isMember = isOwner || project.members?.some((m: any) =>
      (m.userId?._id?.toString() || m.userId?.toString()) === userId
    );
    const initialVisibility = isMember ? 'internal' : 'draft';
    const newSuggestion = new this.suggestionModel({
      ...createDto, projectId, authorId: userId, visibility: initialVisibility, status: 'open',
    });
    return newSuggestion.save();
  }

  async findAllForProject(projectId: string, userId: string): Promise<Suggestion[]> {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    const isOwner = project.ownerId?.toString() === userId;
    const isMember = isOwner || project.members?.some((m: any) =>
      (m.userId?._id?.toString() || m.userId?.toString()) === userId
    );
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
    const suggestion = await this.suggestionModel.findById(suggestionId);
    if (!project || !suggestion) throw new NotFoundException('Suggestion or Project not found');
    const isOwner = project.ownerId?.toString() === userId;
    const isAdmin = isOwner || project.members?.some((m: any) =>
      ((m.userId?._id?.toString() || m.userId?.toString()) === userId) && m.role === 'admin'
    );
    if ((updateDto.visibility || updateDto.status) && !isAdmin) {
      throw new ForbiddenException('Only project moderators can publish or update status.');
    }
    if (!isAdmin && suggestion.authorId.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own suggestions.');
    }
    Object.assign(suggestion, updateDto);
    return suggestion.save();
  }

  async remove(projectId: string, suggestionId: string, userId: string): Promise<void> {
    const project = await this.projectModel.findById(projectId);
    const suggestion = await this.suggestionModel.findById(suggestionId);
    if (!project || !suggestion) throw new NotFoundException('Suggestion not found');
    const isOwner = project.ownerId?.toString() === userId;
    const isAdmin = isOwner || project.members?.some((m: any) =>
      ((m.userId?._id?.toString() || m.userId?.toString()) === userId) && m.role === 'admin'
    );
    if (!isAdmin && suggestion.authorId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own suggestions.');
    }
    await this.suggestionModel.deleteOne({ _id: suggestionId });
  }

  async toggleUpvote(projectId: string, suggestionId: string, userId: string): Promise<{ upvotes: string[]; voted: boolean; count: number }> {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    const suggestion = await this.suggestionModel.findOne({ _id: suggestionId, projectId });
    if (!suggestion) throw new NotFoundException('Suggestion not found');

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
