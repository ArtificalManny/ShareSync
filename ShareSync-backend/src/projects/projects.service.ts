import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument, ProjectMember } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateProjectSettingsDto } from './dto/update-project-settings.dto';
import { AddMemberDto } from './dto/add-member.dto';

type ProjectRole = ProjectMember['role'];
const VALID_ROLES: ProjectRole[] = ['owner', 'member', 'viewer'];

function toRole(input: any): ProjectRole {
  const r = String(input ?? '').toLowerCase() as ProjectRole;
  return (VALID_ROLES as string[]).includes(r) ? (r as ProjectRole) : 'member';
}

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private projectModel: Model<ProjectDocument>) {}

  // ============================================
  // CREATE PROJECT
  // ============================================
  async create(userId: string, createProjectDto: CreateProjectDto) {
    const uid = new Types.ObjectId(userId);

    const project = await this.projectModel.create({
      ...createProjectDto,
      userId: uid, // ✅ schema owner field
      members: [
        {
          userId: uid, // ✅ schema member field
          role: 'owner',
          addedAt: new Date(),
        },
      ],
    });

    // populate only if these paths exist as refs in your schema
    return project.populate([
      { path: 'userId', select: 'firstName lastName username email profilePicture' },
      { path: 'members.userId', select: 'firstName lastName username email profilePicture' },
    ]);
  }

  // ============================================
  // GET ALL PROJECTS (User's projects)
  // ============================================
  async findAll(userId: string) {
    const uid = new Types.ObjectId(userId);

    const projects = await this.projectModel
      .find({
        $or: [{ userId: uid }, { 'members.userId': uid }],
      })
      .populate([{ path: 'userId', select: 'firstName lastName username email profilePicture' }])
      .populate([{ path: 'members.userId', select: 'firstName lastName username email profilePicture' }])
      .sort({ updatedAt: -1 })
      .lean();

    return projects;
  }

  // ============================================
  // GET ONE PROJECT
  // ============================================
  async findOne(projectId: string, userId: string) {
    const project = await this.projectModel
      .findById(projectId)
      .populate([{ path: 'userId', select: 'firstName lastName username email profilePicture' }])
      .populate([{ path: 'members.userId', select: 'firstName lastName username email profilePicture' }])
      .lean();

    if (!project) throw new NotFoundException('Project not found');

    const isMember = this.isProjectMember(project, userId);

    // ✅ schema uses `privacy`, not `visibility`
    const privacy = String((project as any).privacy ?? '').toLowerCase();
    const isPublic = privacy === 'public' || (project as any).publicEnabled === true;

    if (!isMember && !isPublic) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  // ============================================
  // UPDATE PROJECT
  // ============================================
  async update(projectId: string, userId: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    if (!this.canModifyProject(project, userId)) {
      throw new ForbiddenException('Only owner can update project');
    }

    Object.assign(project, updateProjectDto);
    await project.save();

    return project.populate([
      { path: 'userId', select: 'firstName lastName username email profilePicture' },
      { path: 'members.userId', select: 'firstName lastName username email profilePicture' },
    ]);
  }

  // ============================================
  // UPDATE PROJECT SETTINGS
  // ============================================
  async updateSettings(projectId: string, userId: string, updateSettingsDto: UpdateProjectSettingsDto) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    if (!this.canModifyProject(project, userId)) {
      throw new ForbiddenException('Only owner can update settings');
    }

    (project as any).settings = {
      ...(project as any).settings,
      ...updateSettingsDto,
    };

    await project.save();
    return project;
  }

  // ============================================
  // DELETE PROJECT
  // ============================================
  async remove(projectId: string, userId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    if (String((project as any).userId) !== String(userId)) {
      throw new ForbiddenException('Only owner can delete project');
    }

    await project.deleteOne();
    return { message: 'Project deleted successfully' };
  }

  // ============================================
  // ADD MEMBER
  // ============================================
  async addMember(projectId: string, userId: string, addMemberDto: AddMemberDto) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    if (!this.canModifyProject(project, userId)) {
      throw new ForbiddenException('Only owner can add members');
    }

    const targetId = String(addMemberDto.userId);
    const existingMember = (project as any).members?.find(
      (m: any) => String(m.userId) === targetId,
    );

    if (existingMember) throw new BadRequestException('User is already a member');

    (project as any).members = (project as any).members ?? [];
    (project as any).members.push({
      userId: new Types.ObjectId(targetId),
      role: toRole((addMemberDto as any).role),
      addedAt: new Date(),
    });

    await project.save();

    return project.populate([{ path: 'members.userId', select: 'firstName lastName username email profilePicture' }]);
  }

  // ============================================
  // REMOVE MEMBER
  // ============================================
  async removeMember(projectId: string, userId: string, memberUserId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    if (!this.canModifyProject(project, userId)) {
      throw new ForbiddenException('Only owner can remove members');
    }

    // Can't remove owner
    if (String((project as any).userId) === String(memberUserId)) {
      throw new BadRequestException('Cannot remove project owner');
    }

    (project as any).members = ((project as any).members ?? []).filter(
      (m: any) => String(m.userId) !== String(memberUserId),
    );

    await project.save();

    return project.populate([{ path: 'members.userId', select: 'firstName lastName username email profilePicture' }]);
  }

  // ============================================
  // UPDATE MEMBER ROLE
  // ============================================
  async updateMemberRole(projectId: string, userId: string, memberUserId: string, newRole: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    // Only owner can change roles
    if (String((project as any).userId) !== String(userId)) {
      throw new ForbiddenException('Only owner can change member roles');
    }

    const member = (project as any).members?.find(
      (m: any) => String(m.userId) === String(memberUserId),
    );
    if (!member) throw new NotFoundException('Member not found');

    if (member.role === 'owner') {
      throw new BadRequestException('Cannot change owner role');
    }

    member.role = toRole(newRole); // ✅ fixes "string not assignable to ProjectRole"
    await project.save();

    return project.populate([{ path: 'members.userId', select: 'firstName lastName username email profilePicture' }]);
  }

  // ============================================
  // LEAVE PROJECT
  // ============================================
  async leaveProject(projectId: string, userId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    if (String((project as any).userId) === String(userId)) {
      throw new BadRequestException('Owner cannot leave project. Transfer ownership or delete project.');
    }

    (project as any).members = ((project as any).members ?? []).filter(
      (m: any) => String(m.userId) !== String(userId),
    );

    await project.save();
    return { message: 'Left project successfully' };
  }

  // ============================================
  // HELPER METHODS
  // ============================================
  private isProjectMember(project: any, userId: string): boolean {
    const uid = String(userId);
    return (
      String(project.userId) === uid ||
      (project.members ?? []).some((m: any) => String(m.userId) === uid)
    );
  }

  private canModifyProject(project: any, userId: string): boolean {
    // ✅ keep it simple: only project.userId (owner) can modify
    return String(project.userId) === String(userId);
  }
}