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
exports.ProjectsController = void 0;
const common_1 = require("@nestjs/common");
const projects_service_1 = require("../../../Intacom-frontend/projects.service");
let ProjectsController = class ProjectsController {
    constructor(projectsService) {
        this.projectsService = projectsService;
    }
    async getProjects(res) {
        try {
            const projects = await this.projectsService.getProjects();
            res.json(projects);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async createProject(body, req, res) {
        const token = req.cookies.userToken;
        if (!token)
            return res.status(401).json({ error: 'Not authenticated' });
        const user = JSON.parse(token);
        try {
            const newProject = await this.projectsService.createProject(body, user.username);
            res.json(newProject);
        }
        catch (error) {
            res.status(500).json({ error: 'Error creating project' });
        }
    }
    async shareProject(projectId, body, req, res) {
        const token = req.cookies.userToken;
        if (!token)
            return res.status(401).json({ error: 'Not authenticated' });
        const user = JSON.parse(token);
        try {
            const project = await this.projectsService.shareProject(projectId, user.username, body.users);
            res.json(project);
        }
        catch (error) {
            res.status(500).json({ error: 'Error sharing project' });
        }
    }
    async addAnnouncement(projectId, body, req, res) {
        const token = req.cookies.userToken;
        if (!token)
            return res.status(401).json({ error: 'Not authenticated' });
        const user = JSON.parse(token);
        try {
            const project = await this.projectsService.addAnnouncement(projectId, user.username, body);
            res.json(project);
        }
        catch (error) {
            res.status(500).json({ error: 'Error adding announcement' });
        }
    }
    async addTask(projectId, body, req, res) {
        const token = req.cookies.userToken;
        if (!token)
            return res.status(401).json({ error: 'Not authenticated' });
        const user = JSON.parse(token);
        try {
            const project = await this.projectsService.addTask(projectId, user.username, body);
            res.json(project);
        }
        catch (error) {
            res.status(500).json({ error: 'Error adding task' });
        }
    }
    async likeAnnouncement(projectId, annId, req, res) {
        const token = req.cookies.userToken;
        if (!token)
            return res.status(401).json({ error: 'Not authenticated' });
        const user = JSON.parse(token);
        try {
            const project = await this.projectsService.likeAnnouncement(projectId, parseInt(annId));
            res.json(project);
        }
        catch (error) {
            res.status(500).json({ error: 'Error liking announcement' });
        }
    }
    async addAnnouncementComment(projectId, annId, body, req, res) {
        const token = req.cookies.userToken;
        if (!token)
            return res.status(401).json({ error: 'Not authenticated' });
        const user = JSON.parse(token);
        try {
            const project = await this.projectsService.addAnnouncementComment(projectId, parseInt(annId), user.username, body);
            res.json(project);
        }
        catch (error) {
            res.status(500).json({ error: 'Error adding comment' });
        }
    }
    async addTaskComment(projectId, taskId, body, req, res) {
        const token = req.cookies.userToken;
        if (!token)
            return res.status(401).json({ error: 'Not authenticated' });
        const user = JSON.parse(token);
        try {
            const project = await this.projectsService.addTaskComment(projectId, parseInt(taskId), user.username, body);
            res.json(project);
        }
        catch (error) {
            res.status(500).json({ error: 'Error adding task comment' });
        }
    }
    async updateTaskStatus(projectId, taskId, body, req, res) {
        const token = req.cookies.userToken;
        if (!token)
            return res.status(401).json({ error: 'Not authenticated' });
        const user = JSON.parse(token);
        try {
            const project = await this.projectsService.updateTaskStatus(projectId, parseInt(taskId), user.username, body.status);
            res.json(project);
        }
        catch (error) {
            res.status(500).json({ error: 'Error updating task status' });
        }
    }
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getProjects", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "createProject", null);
__decorate([
    (0, common_1.Post)(':projectId/share'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "shareProject", null);
__decorate([
    (0, common_1.Post)(':projectId/announcements'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "addAnnouncement", null);
__decorate([
    (0, common_1.Post)(':projectId/tasks'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "addTask", null);
__decorate([
    (0, common_1.Post)(':projectId/announcements/:annId/like'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('annId')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "likeAnnouncement", null);
__decorate([
    (0, common_1.Post)(':projectId/announcements/:annId/comments'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('annId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "addAnnouncementComment", null);
__decorate([
    (0, common_1.Post)(':projectId/tasks/:taskId/comments'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('taskId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "addTaskComment", null);
__decorate([
    (0, common_1.Post)(':projectId/tasks/:taskId/status'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('taskId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "updateTaskStatus", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, common_1.Controller)('projects'),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService])
], ProjectsController);
//# sourceMappingURL=projects.controller.js.map