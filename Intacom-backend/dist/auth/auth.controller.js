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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./dto/auth.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async test() {
        console.log('AuthController: Test endpoint accessed');
        return { message: 'Test endpoint reached' };
    }
    async login(loginDto) {
        console.log('AuthController: Login request received:', JSON.stringify(loginDto, null, 2));
        try {
            const user = await this.authService.login(loginDto);
            console.log('AuthController: Login successful:', JSON.stringify(user, null, 2));
            return {
                status: 'success',
                message: 'Login successful',
                data: user,
            };
        }
        catch (error) {
            console.error('AuthController: Login error:', error.message);
            throw new common_1.HttpException(error.message || 'An error occurred during login', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async register(registerDto) {
        console.log('AuthController: Register request received:', JSON.stringify(registerDto, null, 2));
        try {
            const user = await this.authService.register(registerDto);
            console.log('AuthController: Register successful:', JSON.stringify(user, null, 2));
            return {
                status: 'success',
                message: 'User registered successfully. Please verify your email.',
                data: user,
            };
        }
        catch (error) {
            console.error('AuthController: Register error:', error.message);
            throw new common_1.HttpException(error.message || 'An error occurred during registration', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async forgotPassword(forgotPasswordDto) {
        console.log('AuthController: Forgot password request received:', JSON.stringify(forgotPasswordDto, null, 2));
        try {
            await this.authService.forgotPassword(forgotPasswordDto.email);
            console.log('AuthController: Forgot password email sent');
            return {
                status: 'success',
                message: 'A reset link has been sent to your email.',
            };
        }
        catch (error) {
            console.error('AuthController: Forgot password error:', error.message);
            throw new common_1.HttpException(error.message || 'An error occurred while sending the reset link', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async resetPassword(resetPasswordDto) {
        console.log('AuthController: Reset password request received:', JSON.stringify(resetPasswordDto, null, 2));
        try {
            await this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword, resetPasswordDto.email);
            console.log('AuthController: Password reset successful');
            return {
                status: 'success',
                message: 'Password reset successful. Please log in with your new password.',
            };
        }
        catch (error) {
            console.error('AuthController: Reset password error:', error.message);
            throw new common_1.HttpException(error.message || 'An error occurred while resetting the password', common_1.HttpStatus.BAD_REQUEST);
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "test", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof auth_dto_1.LoginDto !== "undefined" && auth_dto_1.LoginDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof auth_dto_1.RegisterDto !== "undefined" && auth_dto_1.RegisterDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof auth_dto_1.ForgotPasswordDto !== "undefined" && auth_dto_1.ForgotPasswordDto) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof auth_dto_1.ResetPasswordDto !== "undefined" && auth_dto_1.ResetPasswordDto) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [typeof (_a = typeof auth_service_1.AuthService !== "undefined" && auth_service_1.AuthService) === "function" ? _a : Object])
], AuthController);
//# sourceMappingURL=auth.controller.js.map