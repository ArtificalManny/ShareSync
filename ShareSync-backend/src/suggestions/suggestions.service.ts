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
    @InjectModel('Project') private projectModel: Model<any>, // Injecting Project model to verify roles
  ) {}

  async create(projectId: string, userId: string, createDto: CreateSuggestionDto): Promise<Suggestion> {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    // Role detection: Is the user the owner or in the members array?
    const isOwner = project.ownerId?.toString() === userId;
    const isMember = isOwner || project.members?.some((m: any) => 
      (m.userId?._id?.toString() || m.userId?.toString()) === userId
    );

    // Business Logic (Blueprint Item 5):
    // Members default to 'internal'. Spectators default to 'draft'.
    const initialVisibility = isMember ? 'internal' : 'draft';

    const newSuggestion = new this.suggestionModel({
      ...createDto,
      projectId,
      authorId: userId,
      visibility: initialVisibility,
      status: 'open',
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

    let visibilityFilter: any;

    if (isOwner || isMember) {
      // Moderators and members see everything (public, internal, and pending drafts)
      visibilityFilter = { $in: ['draft', 'internal', 'public'] };
    } else {
      // Spectators only see public suggestions, PLUS their own drafts/internals
      return this.suggestionModel.find({
        projectId,
        $or: [
          { visibility: 'public' },
          { authorId: userId }
        ]
      }).sort({ createdAt: -1 }).exec();
    }

    return this.suggestionModel.find({ 
      projectId, 
      visibility: visibilityFilter 
    })
    .sort({ createdAt: -1 })
    .populate('authorId', 'firstName lastName avatarUrl')
    .exec();
  }

  async update(projectId: string, suggestionId: string, userId: string, updateDto: UpdateSuggestionDto): Promise<Suggestion> {
    const project = await this.projectModel.findById(projectId);
    const suggestion = await this.suggestionModel.findById(suggestionId);
    
    if (!project || !suggestion) throw new NotFoundException('Suggestion or Project not found');

    const isOwner = project.ownerId?.toString() === userId;
    const isAdmin = isOwner || project.members?.some((m: any) => 
      ((m.userId?._id?.toString() || m.userId?.toString()) === userId) && m.role === 'admin'
    );

    // Only moderators (owners/admins) can change visibility or status
    if ((updateDto.visibility || updateDto.status) && !isAdmin) {
      throw new ForbiddenException('Only project moderators can publish or update status.');
    }

    // Normal users can only edit their own title/content
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
}
