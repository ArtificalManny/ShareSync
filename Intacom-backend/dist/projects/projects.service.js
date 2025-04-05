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
let ProjectsService = class ProjectsService {
    constructor(projectModel) {
        this.projectModel = projectModel;
    }
    async create(projectData) {
        try {
            const newProject = new this.projectModel(projectData);
            const savedProject = await newProject.save();
            return savedProject.toObject();
        }
        catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    }
    async findById(id) {
        try {
            const project = await this.projectModel
                .findById(id)
                .lean()
                .exec();
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
    async findByUsername(username) {
        try {
            return await this.projectModel
                .find({ $or: [{ admin: username }, { 'sharedWith.userId': username }] })
                .lean()
                .exec();
        }
        catch (error) {
            console.error('Error in findByUsername:', error);
            throw error;
        }
    }
    async update(id, updates) {
        try {
            const updatedProject = await this.projectModel
                .findByIdAndUpdate(id, updates, { new: true })
                .lean()
                .exec();
            if (!updatedProject) {
                throw new common_1.NotFoundException('Project not found');
            }
            return updatedProject;
        }
        catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }
    async delete(id) {
        try {
            const result = await this.projectModel.findByIdAndDelete(id).exec();
            if (!result) {
                throw new common_1.NotFoundException('Project not found');
            }
        }
        catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(project_schema_1.Project.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map