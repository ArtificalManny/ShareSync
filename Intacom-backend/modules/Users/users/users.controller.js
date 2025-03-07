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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const platform_express_1 = require("@nestjs/platform-express");
const uuid_1 = require("uuid");
const path_1 = require("path");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    getProfile(req) {
        return this.usersService.getUserProfile(req.user.userId);
    }
    updateProfile(updateUserDto, req) {
        return this.usersService.updateUserProfile(req.user.userId, updateUserDto);
    }
    uploadProfileImage(file, req) {
        return this.usersService.updateProfileImage(req.user.userId, file.filename);
    }
    uploadCoverImage(file, req) {
        return this.usersService.updateCoverImage(req.user.userId, file.filename);
    }
};
exports.UsersController = UsersController;
__decorate([
    UseGuards(JwtAuthGuard),
    Get('profile'),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getProfile", null);
__decorate([
    UseGuards(JwtAuthGuard),
    Put('profile'),
    __param(0, (0, common_1.Body)()),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateProfile", null);
__decorate([
    UseGuards(JwtAuthGuard),
    (0, common_1.Post)('upload-profile-image'),
    UseInterceptors((0, platform_express_1.FileInterceptor)('image', {
        storage: diskStorage({
            destination: './uploads/profile',
            filename: (req, file, cb) => {
                const filename = `${(0, uuid_1.v4)()}${(0, path_1.extname)(file.originalname)}`;
                cb(null, filename);
            },
        }),
    })),
    __param(0, UploadedFile()),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "uploadProfileImage", null);
__decorate([
    UseGuards(JwtAuthGuard),
    (0, common_1.Post)('upload-cover-image'),
    UseInterceptors((0, platform_express_1.FileInterceptor)('image', {
        storage: diskStorage({
            destination: './uploads/cover',
            filename: (req, file, cb) => {
                const filename = `${(0, uuid_1.v4)()}${(0, path_1.extname)(file.originalname)}`;
                cb(null, filename);
            },
        }),
    })),
    __param(0, UploadedFile()),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "uploadCoverImage", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
