import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';

interface CreateProjectDto {
  title: string;
  description: string;
  category: string;
  userId: string;
}

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<ProjectDocument> {
    const createdProject = new this.projectModel({
      ...createProjectDto,
      admins: [createProjectDto.userId],
    });
    const project = await createdProject.save();
    await this.addActivity(project._id.toString(), createProjectDto.userId, 'created', `Project ${createProjectDto.title} created`);
    await this.notifyUsers(project, `Project ${createProjectDto.title} has been created.`);
    return project;
  }

  async findAll(userId: string): Promise<ProjectDocument[]> {
    return this.projectModel.find({ $or: [{ userId }, { sharedWith: userId }] }).exec();
  }

  async findOne(id: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  }

  async update(id: string, userId: string, updateProjectDto: any): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    const isAdmin = project.admins.includes(userId);
    if (!isAdmin && updateProjectDto.status) {
      throw new Error('Only admins can update project status');
    }
    if (updateProjectDto.announcement) {
      project.announcement = updateProjectDto.announcement;
      await this.addActivity(id, userId, 'posted announcement', `Announcement: ${updateProjectDto.announcement}`);
      await this.notifyUsers(project, `New announcement in ${project.title}: ${updateProjectDto.announcement}`);
    }
    if (updateProjectDto.snapshot) {
      project.snapshot = updateProjectDto.snapshot;
      await this.addActivity(id, userId, 'updated snapshot', 'Snapshot updated');
      await this.notifyUsers(project, `Snapshot updated in ${project.title}.`);
    }
    if (updateProjectDto.status) {
      project.status = updateProjectDto.status;
      await this.addActivity(id, userId, 'updated status', `Status updated to ${updateProjectDto.status}`);
      await this.notifyUsers(project, `${project.title} status updated to ${updateProjectDto.status}.`);
    }
    const updatedProject = await project.save();
    return updatedProject;
  }

  async addPost(projectId: string, userId: string, postData: any): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    const newPost = { ...postData, userId, createdAt: new Date(), _id: new Types.ObjectId() };
    project.posts.push(newPost);
    const updatedProject = await project.save();
    await this.addActivity(projectId, userId, 'posted', `New post: ${postData.title}`);
    await this.notifyUsers(project, `New post in ${project.title}: ${postData.title}`);
    return updatedProject;
  }

  async addPostComment(projectId: string, postId: string, userId: string, commentData: any): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    const post = project.posts.find(p => p._id.toString() === postId);
    if (!post) {
      throw new Error('Post not found');
    }
    post.comments.push({ ...commentData, userId, createdAt: new Date() });
    const updatedProject = await project.save();
    await this.addActivity(projectId, userId, 'commented on post', `Commented on post: ${post.title}`);
    await this.notifyUsers(project, `New comment on post in ${project.title}`);
    return updatedProject;
  }

  async likePost(projectId: string, postId: string, userId: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    const post = project.posts.find(p => p._id.toString() === postId);
    if (!post) {
      throw new Error('Post not found');
    }
    post.likes = (post.likes || 0) + 1;
    const updatedProject = await project.save();
    await this.addActivity(projectId, userId, 'liked post', `Liked post: ${post.title}`);
    await this.notifyUsers(project, `Post liked in ${project.title}`);
    return updatedProject;
  }

  async addTask(projectId: string, userId: string, taskData: any): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    if (!project.admins.includes(userId)) {
      throw new Error('Only admins can create tasks');
    }
    const newTask = { ...taskData, _id: new Types.ObjectId() };
    project.tasks.push(newTask);
    const updatedProject = await project.save();
    await this.addActivity(projectId, userId, 'created task', `New task: ${taskData.title}`);
    await this.notifyUsers(project, `New task in ${project.title}: ${taskData.title}`);
    return updatedProject;
  }

  async updateTask(projectId: string, taskId: string, userId: string, updateTaskDto: any): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    const task = project.tasks.find(t => t._id.toString() === taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    const isAssigned = task.assignedTo.includes(userId) || project.admins.includes(userId);
    if (!isAssigned) {
      throw new Error('You are not assigned to this task or an admin');
    }
    const oldStatus = task.status;
    Object.assign(task, updateTaskDto);
    if (updateTaskDto.status === 'Completed' && oldStatus !== 'Completed') {
      project.tasksCompleted = (project.tasksCompleted || 0) + 1;
      await this.addActivity(projectId, userId, 'completed task', `Task completed: ${task.title}`);
      await this.notifyUsers(project, `Task completed in ${project.title}: ${task.title}`);
    }
    const updatedProject = await project.save();
    return updatedProject;
  }

  async addSubtask(projectId: string, taskId: string, userId: string, subtaskData: any): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    if (!project.admins.includes(userId)) {
      throw new Error('Only admins can add subtasks');
    }
    const task = project.tasks.find(t => t._id.toString() === taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    task.subtasks.push(subtaskData);
    const updatedProject = await project.save();
    await this.addActivity(projectId, userId, 'added subtask', `Added subtask to ${task.title}`);
    await this.notifyUsers(project, `New subtask added to ${task.title} in ${project.title}`);
    return updatedProject;
  }

  async addTaskComment(projectId: string, taskId: string, userId: string, commentData: any): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    const task = project.tasks.find(t => t._id.toString() === taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    task.comments.push({ ...commentData, userId, createdAt: new Date() });
    const updatedProject = await project.save();
    await this.addActivity(projectId, userId, 'commented on task', `Commented on task: ${task.title}`);
    await this.notifyUsers(project, `New comment on task ${task.title} in ${project.title}`);
    return updatedProject;
  }

  async likeTask(projectId: string, taskId: string, userId: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    const task = project.tasks.find(t => t._id.toString() === taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    task.likes = (task.likes || 0) + 1;
    const updatedProject = await project.save();
    await this.addActivity(projectId, userId, 'liked task', `Liked task: ${task.title}`);
    await this.notifyUsers(project, `Task liked in ${project.title}`);
    return updatedProject;
  }

  async addTeam(projectId: string, userId: string, teamData: any): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    if (!project.admins.includes(userId)) {
      throw new Error('Only admins can add teams');
    }
    const newTeam = { ...teamData, _id: new Types.ObjectId() };
    project.teams.push(newTeam);
    const updatedProject = await project.save();
    await this.addActivity(projectId, userId, 'added team', `Added team: ${teamData.name}`);
    await this.notifyUsers(project, `New team added to ${project.title}: ${teamData.name}`);
    return updatedProject;
  }

  async addFile(projectId: string, userId: string, fileData: any): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    if (!project.admins.includes(userId)) {
      throw new Error('Only admins can add files');
    }
    project.files.push({ ...fileData, uploadedBy: userId, createdAt: new Date() });
    const updatedProject = await project.save();
    await this.addActivity(projectId, userId, 'added file', `Added file: ${fileData.name}`);
    await this.notifyUsers(project, `New file added to ${project.title}: ${fileData.name}`);
    return updatedProject;
  }

  async requestFile(projectId: string, userId: string, fileData: any): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    await this.addActivity(projectId, userId, 'requested file', `Requested to add file: ${fileData.name}`);
    await this.notifyUsers(project, `File addition requested in ${project.title}: ${fileData.name}`);
    return project;
  }

  async shareProject(projectId: string, userId: string, targetUserId: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    if (!project.admins.includes(userId)) {
      throw new Error('Only admins can share projects');
    }
    if (!project.sharedWith.includes(targetUserId)) {
      project.sharedWith.push(targetUserId);
    }
    const updatedProject = await project.save();
    await this.addActivity(projectId, userId, 'shared project', `Shared with user ${targetUserId}`);
    await this.notifyUsers(project, `Project ${project.title} shared with a new user.`);
    return updatedProject;
  }

  async requestShare(projectId: string, userId: string, targetUserId: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new Error('Project not found');
    }
    await this.addActivity(projectId, userId, 'requested share', `Requested to share with user ${targetUserId}`);
    await this.notifyUsers(project, `Share request for ${project.title} to user ${targetUserId}`);
    return project;
  }

  async getProjectMetrics(userId: string): Promise<any> {
    const projects = await this.findAll(userId);
    const totalProjects = projects.length;
    const currentProjects = projects.filter(p => p.status === 'In Progress').length;
    const pastProjects = projects.filter(p => p.status === 'Completed').length;
    const tasksCompleted = projects.reduce((sum, p) => sum + (p.tasksCompleted || 0), 0);

    return {
      totalProjects,
      currentProjects,
      pastProjects,
      tasksCompleted,
    };
  }

  private async addActivity(projectId: string, userId: string, action: string, details: string) {
    await this.projectModel.updateOne(
      { _id: projectId },
      { $push: { activityLog: { action, userId, details, createdAt: new Date() } } }
    );
  }

  private async notifyUsers(project: ProjectDocument, message: string) {
    const usersToNotify = [...new Set([project.userId, ...project.sharedWith, ...project.admins])];
    console.log(`Notification for project ${project._id} to users ${usersToNotify.join(', ')}: ${message}`);
  }
}