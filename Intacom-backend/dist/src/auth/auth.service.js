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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../users/schemas/user.schema");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
let AuthService = class AuthService {
    constructor(userModel) {
        this.userModel = userModel;
    }
    async login(loginDto) {
        const { identifier, password } = loginDto;
        console.log('AuthService: Validating user with identifier:', identifier);
        let user = await this.userModel.findOne({ username: identifier }).exec();
        if (!user) {
            console.log('AuthService: User not found by username, attempting to find by email:', identifier);
            user = await this.userModel.findOne({ email: identifier }).exec();
        }
        if (!user) {
            console.log('AuthService: User not found');
            throw new common_1.HttpException('Invalid username or password.', common_1.HttpStatus.BAD_REQUEST);
        }
        console.log('AuthService: User found:', user.email, 'with hashed password:', user.password);
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('AuthService: Password match result:', isMatch);
        if (!isMatch) {
            console.log('AuthService: Password does not match');
            throw new common_1.HttpException('Invalid username or password.', common_1.HttpStatus.BAD_REQUEST);
        }
        console.log('AuthService: User validated successfully:', user.email);
        return user;
    }
    async register(registerDto) {
        const { firstName, lastName, username, email, password, gender, birthday } = registerDto;
        console.log('AuthService: Registering user with email:', email);
        const { month, day, year } = birthday;
        const monthNum = parseInt(month, 10);
        const dayNum = parseInt(day, 10);
        const yearNum = parseInt(year, 10);
        if (monthNum < 1 || monthNum > 12) {
            throw new common_1.HttpException('Invalid month. Must be between 1 and 12.', common_1.HttpStatus.BAD_REQUEST);
        }
        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
        if (dayNum < 1 || dayNum > daysInMonth) {
            throw new common_1.HttpException(`Invalid day. Must be between 1 and ${daysInMonth} for the selected month.`, common_1.HttpStatus.BAD_REQUEST);
        }
        if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
            throw new common_1.HttpException('Invalid year. Must be between 1900 and the current year.', common_1.HttpStatus.BAD_REQUEST);
        }
        const existingUser = await this.userModel.findOne({ $or: [{ username }, { email }] }).exec();
        if (existingUser) {
            console.log('AuthService: User already exists with username or email:', existingUser.username, existingUser.email);
            throw new common_1.HttpException('Username or email already exists.', common_1.HttpStatus.BAD_REQUEST);
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('AuthService: Password hashed successfully');
        const user = new this.userModel({
            firstName,
            lastName,
            username,
            email,
            password: hashedPassword,
            gender,
            birthday,
            points: 0,
        });
        await user.save();
        console.log('AuthService: User registered successfully:', user.email);
        return user;
    }
    async forgotPassword(email) {
        console.log('AuthService: Processing forgot password for email:', email);
        const user = await this.userModel.findOne({ email }).exec();
        if (!user) {
            console.log('AuthService: User not found for email:', email);
            throw new common_1.HttpException('User not found.', common_1.HttpStatus.NOT_FOUND);
        }
        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = new Date(Date.now() + 3600000);
        await user.save();
        console.log('AuthService: Reset token generated and saved for user:', user.email);
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:54693'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        const mailOptions = {
            from: `"Intacom Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request',
            html: `
        <p>Hello ${user.firstName},</p>
        <p>We received a request to reset your password for your Intacom account.</p>
        <p>Please click the link below to reset your password:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>
        <p>Best regards,<br>The Intacom Team</p>
      `,
        };
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('AuthService: Password reset email sent to:', email, 'Message ID:', info.messageId);
        }
        catch (error) {
            console.error('AuthService: Error sending password reset email:', error);
            throw new common_1.HttpException('Failed to send password reset email. Please try again later.', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async resetPassword(token, newPassword, email) {
        console.log('AuthService: Resetting password with token:', token, 'for email:', email);
        const user = await this.userModel
            .findOne({
            email,
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        })
            .exec();
        if (!user) {
            console.log('AuthService: Invalid or expired reset token for email:', email);
            throw new common_1.HttpException('Invalid or expired reset token.', common_1.HttpStatus.BAD_REQUEST);
        }
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        console.log('AuthService: Password reset successful for user:', user.email);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AuthService);
//# sourceMappingURL=auth.service.js.map