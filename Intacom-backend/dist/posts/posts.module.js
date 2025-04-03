"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const posts_controller_1 = require("./posts.controller");
const posts_service_1 = require("./posts.service");
const post_schema_1 = require("./schemas/post.schema");
const project_schema_1 = require("../projects/schemas/project.schema");
const notifications_service_1 = require("../notifications/notifications.service");
const points_service_1 = require("../points/points.service");
const notification_schema_1 = require("../notifications/schemas/notification.schema");
const point_schema_1 = require("../points/schemas/point.schema");
const user_schema_1 = require("../users/schemas/user.schema");
let PostsModule = class PostsModule {
};
exports.PostsModule = PostsModule;
exports.PostsModule = PostsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: post_schema_1.Post.name, schema: post_schema_1.PostSchema },
                { name: project_schema_1.Project.name, schema: project_schema_1.ProjectSchema },
                { name: notification_schema_1.Notification.name, schema: notification_schema_1.NotificationSchema },
                { name: point_schema_1.Point.name, schema: point_schema_1.PointSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
            ]),
        ],
        controllers: [posts_controller_1.PostsController],
        providers: [posts_service_1.PostsService, notifications_service_1.NotificationsService, points_service_1.PointsService],
    })
], PostsModule);
//# sourceMappingURL=posts.module.js.map