"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const users_module_1 = require("./users/users.module");
const projects_module_1 = require("./projects/projects.module");
const auth_module_1 = require("./auth/auth.module");
const uploads_module_1 = require("./uploads/uploads.module");
const activities_module_1 = require("./activities/activities.module");
const posts_module_1 = require("./posts/posts.module");
const notifications_module_1 = require("./notifications/notifications.module");
const points_module_1 = require("./points/points.module");
const feedback_module_1 = require("./feedback/feedback.module");
const tasks_module_1 = require("./tasks/tasks.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forRoot(process.env.MONGODB_URI),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/uploads',
            }),
            users_module_1.UsersModule,
            projects_module_1.ProjectsModule,
            auth_module_1.AuthModule,
            uploads_module_1.UploadsModule,
            activities_module_1.ActivitiesModule,
            posts_module_1.PostsModule,
            notifications_module_1.NotificationsModule,
            points_module_1.PointsModule,
            feedback_module_1.FeedbackModule,
            tasks_module_1.TasksModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map