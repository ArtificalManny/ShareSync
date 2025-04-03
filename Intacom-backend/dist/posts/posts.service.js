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
const project_schema_1 = require("./schemas/project.schema");
const notifications_service_1 = require("../notifications/notifications.service");
const points_service_1 = require("../points/points.service");
let ProjectsService = class ProjectsService {
    constructor(projectModel, notificationsService, pointsService) {
        this.projectModel = projectModel;
        this.notificationsService = notificationsService;
        this.pointsService = pointsService;
    }
    async create(name, description, admin, color, sharedWith) {
        try {
            const project = new this.projectModel({
                name,
                description,
                admin,
                color,
                sharedWith,
            });
            const savedProject = await project.save();
            for (const collaborator of sharedWith) {
                await this.notificationsService.create(collaborator.userId, 'project_invite', `You've been invited to collaborate on ${name}!`, savedProject._id.toString());
            }
            await this.pointsService.addPoints(admin, 10, 'create_project');
            return savedProject;
        }
        catch (error) {
            console.error('Error in create project:', error);
            throw new common_1.BadRequestException('Failed to create project');
        }
    }
    async findByUsername(username) {
        try {
            return await this.projectModel
                .find({
                $or: [
                    { admin: username },
                    { 'sharedWith.userId': username },
                ],
            })
                .exec();
        }
        catch (error) {
            console.error('Error in findByUsername:', error);
            throw error;
        }
    }
    async findById(id) {
        try {
            const project = await this.projectModel.findById(id).exec();
            if (!project) {
                throw new common_1.NotFoundException('Project not found');
            }
            return project;
        }
        catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }
    async update(id, updates) {
        try {
            const updatedProject = await this.projectModel
                .findByIdAndUpdate(id, updates, { new: true })
                .exec();
            if (!updatedProject) {
                throw new common_1.NotFoundException('Project not found');
            }
            for (const collaborator of updatedProject.sharedWith) {
                await this.notificationsService.create(collaborator.userId, 'project_update', `Project ${updatedProject.name} has been updated!`, updatedProject._id.toString());
            }
            return updatedProject;
        }
        catch (error) {
            console.error('Error in update project:', error);
            throw error;
        }
    }
    async remove(id) {
        try {
            const project = await this.projectModel.findByIdAndDelete(id).exec();
            if (!project) {
                throw new common_1.NotFoundException('Project not found');
            }
            return { message: 'Project deleted successfully' };
        }
        catch (error) {
            console.error('Error in delete project:', error);
            throw error;
        }
    }
    async likeProject(id, userId) {
        try {
            const project = await this.findById(id);
            project.likes += 1;
            await project.save();
            await this.notificationsService.create(project.admin, 'project_like', `Your project ${project.name} received a like!`, project._id.toString());
            await this.pointsService.addPoints(userId, 1, 'like_project');
            return { message: 'Project liked successfully' };
        }
        catch (error) {
            console.error('Error in likeProject:', error);
            throw error;
        }
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(project_schema_1.Project.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        notifications_service_1.NotificationsService,
        points_service_1.PointsService])
], ProjectsService);
//# sourceMappingURL=posts.service.js.map