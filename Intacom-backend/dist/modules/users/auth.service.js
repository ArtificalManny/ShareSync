"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../users/schemas/user.schema");
const bcrypt = __importStar(require("bcrypt"));
const uuid_1 = require("uuid");
const nodemailer = __importStar(require("nodemailer"));
const notifications_service_1 = require("../notifications/notifications.service");
const points_service_1 = require("../points/points.service");
let AuthService = class AuthService {
    constructor(userModel, notificationsService, pointsService) {
        this.userModel = userModel;
        this.notificationsService = notificationsService;
        this.pointsService = pointsService;
    }
    async login(loginDto) {
        try {
            const { identifier, password } = loginDto;
            const user = await this.userModel
                .findOne({
                $or: [{ email: identifier }, { username: identifier }],
            })
                .exec();
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            if (!user.isVerified) {
                throw new common_1.UnauthorizedException('Please verify your email');
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            await this.pointsService.addPoints(user._id.toString(), 2, 'login');
            return { data: { user } };
        }
        catch (error) {
            console.error('Error in login:', error);
            throw error;
        }
    }
    async register(registerDto) {
        try {
            const { firstName, lastName, username, email, password, gender, birthday } = registerDto;
            const existingUser = await this.userModel
                .findOne({
                $or: [{ email }, { username }],
            })
                .exec();
            if (existingUser) {
                throw new common_1.BadRequestException('User already exists');
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const verificationToken = (0, uuid_1.v4)();
            const user = new this.userModel({
                firstName,
                lastName,
                username,
                email,
                password: hashedPassword,
                gender,
                birthday,
                verificationToken,
                isVerified: false,
            });
            await user.save();
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: Number(process.env.EMAIL_PORT),
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Verify your email',
                html: `
          <h1>Welcome to Intacom!</h1>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}">Verify Email</a>
        `,
            };
            await transporter.sendMail(mailOptions);
            await this.pointsService.addPoints(user._id.toString(), 5, 'register');
            return { message: 'Registration successful. Please check your email to verify your account.' };
        }
        catch (error) {
            console.error('Error in register:', error);
            throw error;
        }
    }
    async recover(email) {
        try {
            const user = await this.userModel.findOne({ email }).exec();
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const resetToken = (0, uuid_1.v4)();
            user.resetToken = resetToken;
            await user.save();
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: Number(process.env.EMAIL_PORT),
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Reset your password',
                html: `
          <h1>Password Reset</h1>
          <p>Click the link below to reset your password:</p>
          <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">Reset Password</a>
        `,
            };
            await transporter.sendMail(mailOptions);
            return { message: 'Password reset email sent.' };
        }
        catch (error) {
            console.error('Error in recover:', error);
            throw error;
        }
    }
    async resetPassword(resetPasswordDto) {
        try {
            const { token, password } = resetPasswordDto;
            const user = await this.userModel.findOne({ resetToken: token }).exec();
            if (!user) {
                throw new common_1.BadRequestException('Invalid or expired token');
            }
            user.password = await bcrypt.hash(password, 10);
            user.resetToken = undefined;
            await user.save();
            return { message: 'Password reset successfully' };
        }
        catch (error) {
            console.error('Error in resetPassword:', error);
            throw error;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        notifications_service_1.NotificationsService, typeof (_a = typeof points_service_1.PointsService !== "undefined" && points_service_1.PointsService) === "function" ? _a : Object])
], AuthService);
//# sourceMappingURL=auth.service.js.map