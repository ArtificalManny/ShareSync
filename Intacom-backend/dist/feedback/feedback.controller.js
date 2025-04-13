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
exports.FeedbackController = void 0;
const common_1 = require("@nestjs/common");
const feedback_service_1 = require("./feedback.service");
let FeedbackController = class FeedbackController {
    constructor(feedbackService) {
        this.feedbackService = feedbackService;
    }
    async create(projectId, userId, rating, message) {
        try {
            const feedback = await this.feedbackService.create(projectId, userId, rating, message);
            return { message: 'Feedback submitted successfully', data: feedback };
        }
        catch (error) {
            console.error('Error in create feedback:', error);
            throw error;
        }
    }
    async findByProjectId(projectId) {
        try {
            const feedback = await this.feedbackService.findByProjectId(projectId);
            return { data: feedback };
        }
        catch (error) {
            console.error('Error in findByProjectId:', error);
            throw error;
        }
    }
    async delete(id) {
        try {
            return await this.feedbackService.delete(id);
        }
        catch (error) {
            console.error('Error in delete feedback:', error);
            throw error;
        }
    }
};
exports.FeedbackController = FeedbackController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)('projectId')),
    __param(1, (0, common_1.Body)('userId')),
    __param(2, (0, common_1.Body)('rating')),
    __param(3, (0, common_1.Body)('message')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, String]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('project/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "findByProjectId", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "delete", null);
exports.FeedbackController = FeedbackController = __decorate([
    (0, common_1.Controller)('feedback'),
    __metadata("design:paramtypes", [typeof (_a = typeof feedback_service_1.FeedbackService !== "undefined" && feedback_service_1.FeedbackService) === "function" ? _a : Object])
], FeedbackController);
//# sourceMappingURL=feedback.controller.js.map