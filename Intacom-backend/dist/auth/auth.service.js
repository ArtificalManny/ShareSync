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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const uuid_1 = require("uuid");
let AuthService = class AuthService {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async login(loginDto) {
        console.log('AuthService: Login attempt with identifier:', loginDto.identifier);
        const user = await this.usersService.findByEmail(loginDto.identifier) || await this.usersService.findByUsername(loginDto.identifier);
        if (!user) {
            console.log('AuthService: User not found for identifier:', loginDto.identifier);
            throw new common_1.HttpException('Invalid username or password', common_1.HttpStatus.BAD_REQUEST);
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            console.log('AuthService: Invalid password for user:', user.email);
            throw new common_1.HttpException('Invalid username or password', common_1.HttpStatus.BAD_REQUEST);
        }
        return user;
    }
    async register(registerDto) {
        console.log('AuthService: Register attempt with email:', registerDto.email);
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            console.log('AuthService: User already exists with email:', registerDto.email);
            throw new common_1.HttpException('User already exists', common_1.HttpStatus.BAD_REQUEST);
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.usersService.create(Object.assign(Object.assign({}, registerDto), { password: hashedPassword, verificationToken: (0, uuid_1.v4)() }));
        await this.sendVerificationEmail(user.email, user.verificationToken);
        return user;
    }
    async sendVerificationEmail(email, token) {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT, 10),
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify your email for INTACOM',
            text: `Please verify your email by clicking the following link: ${process.env.FRONTEND_URL}/verify-email?token=${token}`,
        };
        await transporter.sendMail(mailOptions);
    }
    async forgotPassword(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.HttpException('User not found', common_1.HttpStatus.NOT_FOUND);
        }
        const resetToken = (0, uuid_1.v4)();
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000);
        await user.save();
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT, 10),
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset for INTACOM',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n
        ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
        };
        await transporter.sendMail(mailOptions);
    }
    async resetPassword(token, newPassword, email) {
        const user = await this.usersService.findByEmail(email);
        if (!user || user.resetPasswordToken !== token || (user.resetPasswordExpires && user.resetPasswordExpires < new Date())) {
            throw new common_1.HttpException('Password reset token is invalid or has expired', common_1.HttpStatus.BAD_REQUEST);
        }
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
    }
    async verifyEmail(token) {
        const user = await this.usersService.findAll().then(users => users.find(u => u.verificationToken === token));
        if (!user) {
            throw new common_1.HttpException('Verification token is invalid', common_1.HttpStatus.BAD_REQUEST);
        }
        user.verified = true;
        user.verificationToken = undefined;
        await user.save();
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], AuthService);
//# sourceMappingURL=auth.service.js.map