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
const project_model_1 = require("../../models/project.model");
let ProjectsService = class ProjectsService {
    constructor(projectModel) {
        this.projectModel = projectModel;
    }
    async getProjects() {
        return this.projectModel.find();
    }
    async createProject(body, admin) {
        const newProject = new this.projectModel({
            ...body,
            id: Date.now(),
            admin,
            sharedWith: [],
        });
        return newProject.save();
    }
    async shareProject(projectId, username, users) {
        const project = await this.projectModel.findById(projectId);
        if (!project || (username !== project.admin && !project.sharedWith.includes(username))) {
            throw new Error('Unauthorized');
        }
        project.sharedWith = [...new Set([...project.sharedWith, ...users])];
        return project.save();
    }
    async addAnnouncement(projectId, username, body) {
        const project = await this.projectModel.findById(projectId);
        if (!project || (username !== project.admin && !project.sharedWith.includes(username))) {
            throw new Error('Unauthorized');
        }
        project.announcements.push({ ...body, id: Date.now(), likes: 0, comments: [], user: username });
        await project.save();
        return project;
    }
    async addTask(projectId, username, body) {
        const project = await this.projectModel.findById(projectId);
        if (!project || (username !== project.admin && !project.sharedWith.includes(username))) {
            throw new Error('Unauthorized');
        }
        project.tasks.push({ ...body, id: Date.now(), comments: [], user: username });
        await project.save();
        return project;
    }
    async likeAnnouncement(projectId, annId) {
        const project = await this.projectModel.findById(projectId);
        const announcement = project.announcements.find(a => a.id === annId);
        if (announcement)
            announcement.likes += 1;
        await project.save();
        return project;
    }
    async addAnnouncementComment(projectId, annId, username, body) {
        const project = await this.projectModel.findById(projectId);
        const announcement = project.announcements.find(a => a.id === annId);
        if (announcement)
            announcement.comments.push({ ...body, user: username });
        await project.save();
        return project;
    }
    async addTaskComment(projectId, taskId, username, body) {
        const project = await this.projectModel.findById(projectId);
        const task = project.tasks.find(t => t.id === taskId);
        if (task)
            task.comments.push({ ...body, user: username });
        await project.save();
        return project;
    }
    async updateTaskStatus(projectId, taskId, username, status) {
        const project = await this.projectModel.findById(projectId);
        const task = project.tasks.find(t => t.id === taskId);
        if (task && (username === task.assignee || username === project.admin)) {
            task.status = status;
            await project.save();
            return project;
        }
        else {
            throw new Error('Unauthorized to update task status');
        }
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(project_model_1.Project.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map