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
const common_2 = require("@nestjs/common");
const projects_service_1 = require("./projects.service");
let ProjectsController = class ProjectsController {
    constructor(projectsService) {
        this.projectsService = projectsService;
    }
    async createProject(res, name, description, admin, color) {
        try {
            const project = await this.projectsService.createProject(name, description, admin, color);
            res.status(201).json({ project });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getUserProjects(res, username) {
        try {
            const projects = await this.projectsService.getUserProjects(username);
            res.status(200).json(projects);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async addMember(res, projectId, username, role) {
        try {
            const project = await this.projectsService.addMember(projectId, username, role);
            res.status(200).json({ project });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, common_2.Post)(),
    __param(0, (0, common_2.Res)()),
    __param(1, (0, common_2.Body)('name')),
    __param(2, (0, common_2.Body)('description')),
    __param(3, (0, common_2.Body)('admin')),
    __param(4, (0, common_2.Body)('color')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "createProject", null);
__decorate([
    (0, common_2.Get)(':username'),
    __param(0, (0, common_2.Res)()),
    __param(1, (0, common_2.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getUserProjects", null);
__decorate([
    (0, common_2.Post)(':projectId/addMember'),
    __param(0, (0, common_2.Res)()),
    __param(1, (0, common_2.Param)('projectId')),
    __param(2, (0, common_2.Body)('username')),
    __param(3, (0, common_2.Body)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "addMember", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, common_2.Controller)('projects'),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService])
], ProjectsController);
//# sourceMappingURL=projects.controller.js.map