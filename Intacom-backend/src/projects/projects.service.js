"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const project_model_1 = require("../../../models/project.model"); // Updated path
let ProjectsService = class ProjectsService {
    constructor(projectModel) {
        this.projectModel = projectModel;
    }
    async createProject(name, description, admin, sharedWith = [], announcements = [], tasks = []) {
        const project = new this.projectModel({ name, description, admin, sharedWith, announcements, tasks });
        return project.save();
    }
    async findAll() {
        return this.projectModel.find().exec();
    }
    async findById(id) {
        return this.projectModel.findById(id).exec();
    }
    async shareProject(projectId, users, admin) {
        const project = await this.projectModel.findById(projectId);
        if (!project || project.admin !== admin) {
            throw new Error('Unauthorized or project not found');
        }
        project.sharedWith = [...new Set([...project.sharedWith, ...users])];
        return project.save();
    }
    async addAnnouncement(projectId, content, media, user) {
        const project = await this.projectModel.findById(projectId);
        if (!project)
            throw new Error('Project not found');
        project.announcements.push({ content, media, user, likes: 0, comments: [] });
        return project.save();
    }
    async addTask(projectId, title, assignee, dueDate, status, user) {
        const project = await this.projectModel.findById(projectId);
        if (!project)
            throw new Error('Project not found');
        project.tasks.push({ title, assignee, dueDate, status, user, comments: [] });
        return project.save();
    }
    async likeAnnouncement(projectId, annId, user) {
        const project = await this.projectModel.findById(projectId);
        if (!project)
            throw new Error('Project not found');
        const announcement = project.announcements.id(annId);
        if (!announcement)
            throw new Error('Announcement not found');
        announcement.likes = (announcement.likes || 0) + 1;
        return project.save();
    }
    async addAnnouncementComment(projectId, annId, text, user) {
        const project = await this.projectModel.findById(projectId);
        if (!project)
            throw new Error('Project not found');
        const announcement = project.announcements.id(annId);
        if (!announcement)
            throw new Error('Announcement not found');
        announcement.comments.push({ user, text });
        return project.save();
    }
    async addTaskComment(projectId, taskId, text, user) {
        const project = await this.projectModel.findById(projectId);
        if (!project)
            throw new Error('Project not found');
        const task = project.tasks.id(taskId);
        if (!task)
            throw new Error('Task not found');
        task.comments.push({ user, text });
        return project.save();
    }
    async updateTaskStatus(projectId, taskId, status, user) {
        const project = await this.projectModel.findById(projectId);
        if (!project)
            throw new Error('Project not found');
        const task = project.tasks.id(taskId);
        if (!task)
            throw new Error('Task not found');
        task.status = status;
        return project.save();
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(project_model_1.Project.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ProjectsService);
