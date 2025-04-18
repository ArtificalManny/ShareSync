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
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const notifications_module_1 = require("./notifications/notifications.module");
const points_module_1 = require("./points/points.module");
const projects_module_1 = require("./projects/projects.module");
const posts_module_1 = require("./posts/posts.module");
const app_gateway_1 = require("./app.gateway");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forRoot('mongodb://localhost:27017/sharesync'),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            notifications_module_1.NotificationsModule,
            points_module_1.PointsModule,
            projects_module_1.ProjectsModule,
            posts_module_1.PostsModule,
        ],
        providers: [app_gateway_1.AppGateway],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map