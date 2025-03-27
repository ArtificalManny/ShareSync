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
const notifications_service_1 = require("../notifications/notifications.service");
let ProjectsController = class ProjectsController {
    constructor(projectsService, notificationsService) {
        this.projectsService = projectsService;
        this.notificationsService = notificationsService;
    }
    async create(projectData) {
        const project = await this.projectsService.create(projectData);
        await this.notificationsService.create(projectData.admin, `New project "${projectData.name}" created`);
        if (projectData.sharedWith && projectData.sharedWith.length > 0) {
            for (const sharedUser of projectData.sharedWith) {
                await this.notificationsService.create(sharedUser.userId, `You have been added to the project "${projectData.name}" as ${sharedUser.role}`);
            }
        }
        return { data: { project } };
    }
    async findByAdmin(admin) {
        const projects = await this.projectsService.findByAdmin(admin);
        return { data: projects };
    }
    async findById(id) {
        const project = await this.projectsService.findById(id);
        return { data: { project } };
    }
};
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':admin'),
    __param(0, (0, common_1.Param)('admin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "findByAdmin", null);
__decorate([
    (0, common_1.Get)('by-id/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "findById", null);
ProjectsController = __decorate([
    (0, common_1.Controller)('projects'),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService,
        notifications_service_1.NotificationsService])
], ProjectsController);
exports.ProjectsController = ProjectsController;
//# sourceMappingURL=projects.controller.js.map