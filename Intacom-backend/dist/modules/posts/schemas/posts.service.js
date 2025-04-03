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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const post_schema_1 = require("./schemas/post.schema");
const project_schema_1 = require("../projects/schemas/project.schema");
const notifications_service_1 = require("../notifications/notifications.service");
const points_service_1 = require("../points/points.service");
let PostsService = class PostsService {
    constructor(postModel, projectModel, notificationsService, pointsService) {
        this.postModel = postModel;
        this.projectModel = projectModel;
        this.notificationsService = notificationsService;
        this.pointsService = pointsService;
    }
    async create(projectId, userId, content, images) {
        try {
            const post = new this.postModel({
                projectId,
                userId,
                content,
                images,
            });
            const savedPost = await post.save();
            const project = await this.projectModel.findById(projectId).exec();
            if (!project) {
                throw new common_1.NotFoundException('Project not found');
            }
            for (const collaborator of project.sharedWith) {
                await this.notificationsService.create(collaborator.userId, 'new_post', `A new post was added to ${project.name}!`, savedPost._id.toString());
            }
            await this.pointsService.addPoints(userId, 5, 'create_post');
            return savedPost;
        }
        catch (error) {
            console.error('Error in create post:', error);
            throw new common_1.BadRequestException('Failed to create post');
        }
    }
    async findByProject(projectId) {
        try {
            return await this.postModel.find({ projectId }).sort({ createdAt: -1 }).exec();
        }
        catch (error) {
            console.error('Error in findByProject:', error);
            throw error;
        }
    }
    async update(id, updates) {
        try {
            const updatedPost = await this.postModel
                .findByIdAndUpdate(id, updates, { new: true })
                .exec();
            if (!updatedPost) {
                throw new common_1.NotFoundException('Post not found');
            }
            return updatedPost;
        }
        catch (error) {
            console.error('Error in update post:', error);
            throw error;
        }
    }
    async delete(id) {
        try {
            const post = await this.postModel.findByIdAndDelete(id).exec();
            if (!post) {
                throw new common_1.NotFoundException('Post not found');
            }
            return { message: 'Post deleted successfully' };
        }
        catch (error) {
            console.error('Error in delete post:', error);
            throw error;
        }
    }
    async likePost(id, userId) {
        try {
            const post = await this.postModel.findById(id).exec();
            if (!post) {
                throw new common_1.NotFoundException('Post not found');
            }
            if (!post.likedBy.includes(userId)) {
                post.likes += 1;
                post.likedBy.push(userId);
                await post.save();
                await this.notificationsService.create(post.userId, 'post_like', `Your post received a like!`, post._id.toString());
                await this.pointsService.addPoints(userId, 1, 'like_post');
            }
            return { message: 'Post liked successfully' };
        }
        catch (error) {
            console.error('Error in likePost:', error);
            throw error;
        }
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(post_schema_1.Post.name)),
    __param(1, (0, mongoose_1.InjectModel)(project_schema_1.Project.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model, typeof (_a = typeof notifications_service_1.NotificationsService !== "undefined" && notifications_service_1.NotificationsService) === "function" ? _a : Object, typeof (_b = typeof points_service_1.PointsService !== "undefined" && points_service_1.PointsService) === "function" ? _b : Object])
], PostsService);
//# sourceMappingURL=posts.service.js.map