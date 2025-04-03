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
exports.PointsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const point_schema_1 = require("./schemas/point.schema");
const users_service_1 = require("../users/users.service");
let PointsService = class PointsService {
    constructor(pointModel, usersService) {
        this.pointModel = pointModel;
        this.usersService = usersService;
    }
    async addPoints(userId, points, action) {
        const point = new this.pointModel({
            userId,
            points,
            action,
        });
        await point.save();
        const user = await this.usersService.findById(userId);
        user.points += points;
        await user.save();
        return point;
    }
    async getLeaderboard() {
        const users = await this.usersService.findAll();
        return users.sort((a, b) => b.points - a.points).slice(0, 10);
    }
};
exports.PointsService = PointsService;
exports.PointsService = PointsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(point_schema_1.Point.name)),
    __metadata("design:paramtypes", [mongoose_2.Model, typeof (_a = typeof users_service_1.UsersService !== "undefined" && users_service_1.UsersService) === "function" ? _a : Object])
], PointsService);
//# sourceMappingURL=points.service.js.map