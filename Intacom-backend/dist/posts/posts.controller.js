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
exports.PostsController = void 0;
const common_1 = require("@nestjs/common");
const posts_service_1 = require("./posts.service");
let PostsController = class PostsController {
    constructor(postsService) {
        this.postsService = postsService;
    }
    async create(projectId, userId, content, images) {
        try {
            return await this.postsService.create(projectId, userId, content, images);
        }
        catch (error) {
            console.error('Error in create post:', error);
            throw error;
        }
    }
    async findByProject(projectId) {
        try {
            return await this.postsService.findByProject(projectId);
        }
        catch (error) {
            console.error('Error in findByProject:', error);
            throw error;
        }
    }
    async update(id, updates) {
        try {
            return await this.postsService.update(id, updates);
        }
        catch (error) {
            console.error('Error in update post:', error);
            throw error;
        }
    }
    async delete(id) {
        try {
            return await this.postsService.delete(id);
        }
        catch (error) {
            console.error('Error in delete post:', error);
            throw error;
        }
    }
    async likePost(id, userId) {
        try {
            return await this.postsService.likePost(id, userId);
        }
        catch (error) {
            console.error('Error in likePost:', error);
            throw error;
        }
    }
};
exports.PostsController = PostsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)('projectId')),
    __param(1, (0, common_1.Body)('userId')),
    __param(2, (0, common_1.Body)('content')),
    __param(3, (0, common_1.Body)('images')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Array]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('project/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "findByProject", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('like/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "likePost", null);
exports.PostsController = PostsController = __decorate([
    (0, common_1.Controller)('posts'),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], PostsController);
//# sourceMappingURL=posts.controller.js.map