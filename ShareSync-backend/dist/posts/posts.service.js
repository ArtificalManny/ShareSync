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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const post_schema_1 = require("./schemas/post.schema");
const project_schema_1 = require("../projects/schemas/project.schema");
const notifications_service_1 = require("../notifications/notifications.service");
let PostsService = class PostsService {
    constructor(postModel, projectModel, notificationsService) {
        this.postModel = postModel;
        this.projectModel = projectModel;
        this.notificationsService = notificationsService;
    }
    async create(post) {
        const createdPost = new this.postModel(post);
        const project = await this.projectModel.findById(post.projectId).exec();
        if (!project) {
            throw new common_1.HttpException('Project not found', common_1.HttpStatus.NOT_FOUND);
        }
        for (const collaborator of project.sharedWith) {
            if (collaborator !== post.userId) {
                await this.notificationsService.create({
                    userId: collaborator,
                    content: `New post in project ${project.name} by user ${post.userId}`,
                });
            }
        }
        return createdPost.save();
    }
    async findByProject(projectId) {
        return this.postModel.find({ projectId }).exec();
    }
    async update(id, updates) {
        const updatedPost = await this.postModel
            .findByIdAndUpdate(id, updates, { new: true })
            .exec();
        if (!updatedPost) {
            throw new common_1.HttpException('Post not found', common_1.HttpStatus.NOT_FOUND);
        }
        return updatedPost;
    }
    async delete(id) {
        const result = await this.postModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new common_1.HttpException('Post not found', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async like(id, userId) {
        const post = await this.postModel.findById(id).exec();
        if (!post) {
            throw new common_1.HttpException('Post not found', common_1.HttpStatus.NOT_FOUND);
        }
        if (post.likes.includes(userId)) {
            post.likes = post.likes.filter((id) => id !== userId);
        }
        else {
            post.likes.push(userId);
            const project = await this.projectModel.findById(post.projectId).exec();
            if (!project) {
                throw new common_1.HttpException('Project not found', common_1.HttpStatus.NOT_FOUND);
            }
            for (const collaborator of project.sharedWith) {
                if (collaborator !== userId) {
                    await this.notificationsService.create({
                        userId: collaborator,
                        content: `User ${userId} liked a post in project ${project.name}`,
                    });
                }
            }
        }
        await post.save();
        return post;
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(post_schema_1.Post.name)),
    __param(1, (0, mongoose_1.InjectModel)(project_schema_1.Project.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        notifications_service_1.NotificationsService])
], PostsService);
//# sourceMappingURL=posts.service.js.map