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
const projects_service_1 = require("./projects.service");
let ProjectsController = class ProjectsController {
    constructor(projectsService) {
        this.projectsService = projectsService;
    }
    async create(name, description, admin, color, sharedWith) {
        const projectData = { name, description, admin, color, sharedWith };
        const project = await this.projectsService.create(projectData);
        return project;
    }
    async findById(id) {
        return await this.projectsService.findById(id);
    }
    async findByUsername(username) {
        return await this.projectsService.findByUsername(username);
    }
    async update(id, name, description, color, sharedWith, status, likes, comments) {
        const updates = { name, description, color, sharedWith, status, likes, comments };
        return await this.projectsService.update(id, updates);
    }
    async delete(id) {
        return await this.projectsService.delete(id);
    }
    async likeProject(id, userId) {
        return await this.projectsService.likeProject(id, userId);
    }
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)('name')),
    __param(1, (0, common_1.Body)('description')),
    __param(2, (0, common_1.Body)('admin')),
    __param(3, (0, common_1.Body)('color')),
    __param(4, (0, common_1.Body)('sharedWith')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Array]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('by-id/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)(':username'),
    __param(0, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "findByUsername", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('name')),
    __param(2, (0, common_1.Body)('description')),
    __param(3, (0, common_1.Body)('color')),
    __param(4, (0, common_1.Body)('sharedWith')),
    __param(5, (0, common_1.Body)('status')),
    __param(6, (0, common_1.Body)('likes')),
    __param(7, (0, common_1.Body)('comments')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Array, String, Number, Number]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('like/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "likeProject", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, common_1.Controller)('projects'),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService])
], ProjectsController);
//# sourceMappingURL=projects.controller.js.map