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
const create_project_dto_1 = require("./dto/create-project.dto");
const update_project_dto_1 = require("./dto/update-project.dto");
const app_gateway_1 = require("../app.gateway");
const common_2 = require("@nestjs/common");
let ProjectsController = class ProjectsController {
    constructor(projectsService, appGateway) {
        this.projectsService = projectsService;
        this.appGateway = appGateway;
    }
    async create(createProjectDto) {
        const project = await this.projectsService.create(createProjectDto);
        this.appGateway.emitProjectCreated(project);
        return {
            status: 'success',
            message: 'Project created successfully',
            data: project,
        };
    }
    async findByUsername(username) {
        const projects = await this.projectsService.findByUsername(username);
        return {
            status: 'success',
            data: projects,
        };
    }
    async findById(id) {
        const project = await this.projectsService.findById(id);
        if (!project) {
            throw new common_2.HttpException('Project not found', common_2.HttpStatus.NOT_FOUND);
        }
        return {
            status: 'success',
            data: project,
        };
    }
    async update(id, updateProjectDto) {
        const project = await this.projectsService.update(id, updateProjectDto);
        return {
            status: 'success',
            message: 'Project updated successfully',
            data: project,
        };
    }
    async remove(id) {
        await this.projectsService.remove(id);
        return {
            status: 'success',
            message: 'Project deleted successfully',
        };
    }
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_project_dto_1.CreateProjectDto]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':username'),
    __param(0, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "findByUsername", null);
__decorate([
    (0, common_1.Get)('by-id/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_project_dto_1.UpdateProjectDto]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "remove", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, common_1.Controller)('projects'),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService,
        app_gateway_1.AppGateway])
], ProjectsController);
//# sourceMappingURL=projects.controller.js.map