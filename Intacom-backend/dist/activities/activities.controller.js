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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivitiesController = void 0;
const common_1 = require("@nestjs/common");
const activities_service_1 = require("./activities.service");
let ActivitiesController = class ActivitiesController {
    constructor(activitiesService) {
        this.activitiesService = activitiesService;
    }
    async create(userId, projectId, action) {
        try {
            return await this.activitiesService.create(userId, projectId, action);
        }
        catch (error) {
            console.error('Error in create activity:', error);
            throw error;
        }
    }
    async findByUser(userId) {
        try {
            return await this.activitiesService.findByUser(userId);
        }
        catch (error) {
            console.error('Error in findByUser:', error);
            throw error;
        }
    }
    async findByProject(projectId) {
        try {
            return await this.activitiesService.findByProject(projectId);
        }
        catch (error) {
            console.error('Error in findByProject:', error);
            throw error;
        }
    }
};
exports.ActivitiesController = ActivitiesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)('userId')),
    __param(1, (0, common_1.Body)('projectId')),
    __param(2, (0, common_1.Body)('action')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "findByUser", null);
__decorate([
    (0, common_1.Get)('project/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "findByProject", null);
exports.ActivitiesController = ActivitiesController = __decorate([
    (0, common_1.Controller)('activities'),
    __metadata("design:paramtypes", [typeof (_a = typeof activities_service_1.ActivitiesService !== "undefined" && activities_service_1.ActivitiesService) === "function" ? _a : Object])
], ActivitiesController);
//# sourceMappingURL=activities.controller.js.map