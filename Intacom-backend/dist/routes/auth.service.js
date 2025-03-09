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
const common_2 = require("@nestjs/common");
const mongoose_3 = require("@nestjs/mongoose");
const mongoose_4 = require("mongoose");
const bcrypt = require("bcrypt");
let AuthService = class AuthService {
    constructor(userModel) {
        this.userModel = userModel;
    }
    async register(firstName, lastName, username, password, email, gender, birthday, profilePic) {
        const existingUser = await this.userModel.findOne({ username });
        if (existingUser)
            throw new Error('Username already exists');
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new this.userModel({
            firstName,
            lastName,
            username,
            password: hashedPassword,
            email,
            gender,
            birthday,
            profilePic,
        });
        return user.save();
    }
    async login(identifier, password) {
        const user = await this.userModel.findOne({ $or: [{ username: identifier }, { email: identifier }] });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new Error('Invalid credentials');
        }
        return user;
    }
    async findUser(identifier) {
        return this.userModel.findOne({ $or: [{ username: identifier }, { email: identifier }] });
    }
    async recoverPassword(email) {
        const user = await this.userModel.findOne({ email });
        if (!user)
            throw new Error('Email not found');
        const token = Math.random().toString(36).substring(2);
        user.resetToken = token;
        user.resetTokenExpires = new Date(Date.now() + 3600000);
        await user.save();
        return { message: 'Recovery token generated', token };
    }
    async resetPassword(token, newPassword) {
        const user = await this.userModel.findOne({
            resetToken: token,
            resetTokenExpires: { $gt: new Date() },
        });
        if (!user)
            throw new Error('Invalid or expired token');
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpires = undefined;
        return user.save();
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_2.Injectable)(),
    __param(0, (0, mongoose_3.InjectModel)('User')),
    __metadata("design:paramtypes", [mongoose_4.Model])
], AuthService);
//# sourceMappingURL=auth.service.js.map