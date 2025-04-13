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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointsController = void 0;
const common_1 = require("@nestjs/common");
const points_service_1 = require("./points.service");
let PointsController = class PointsController {
    constructor(pointsService) {
        this.pointsService = pointsService;
    }
    async getLeaderboard() {
        const leaderboard = await this.pointsService.getLeaderboard();
        return {
            status: 'success',
            data: leaderboard,
        };
    }
};
exports.PointsController = PointsController;
__decorate([
    (0, common_1.Get)('leaderboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PointsController.prototype, "getLeaderboard", null);
exports.PointsController = PointsController = __decorate([
    (0, common_1.Controller)('points'),
    __metadata("design:paramtypes", [typeof (_a = typeof points_service_1.PointsService !== "undefined" && points_service_1.PointsService) === "function" ? _a : Object])
], PointsController);
//# sourceMappingURL=points.controller.js.map