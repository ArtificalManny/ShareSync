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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./schemas/user.schema");
let UsersService = class UsersService {
    constructor(userModel) {
        this.userModel = userModel;
    }
    async create(createUserDto) {
        try {
            const createdUser = new this.userModel(createUserDto);
            return await createdUser.save();
        }
        catch (error) {
            console.error('Error in create user:', error);
            throw new common_1.BadRequestException('Failed to create user');
        }
    }
    async findByUsername(username) {
        try {
            const user = await this.userModel.findOne({ username }).exec();
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            return { data: user };
        }
        catch (error) {
            console.error('Error in findByUsername:', error);
            throw error;
        }
    }
    async findByEmail(email) {
        try {
            const user = await this.userModel.findOne({ email }).exec();
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            return user;
        }
        catch (error) {
            console.error('Error in findByEmail:', error);
            throw error;
        }
    }
    async findById(id) {
        try {
            const user = await this.userModel.findById(id).exec();
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            return user;
        }
        catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }
    async findAll() {
        try {
            return await this.userModel.find().exec();
        }
        catch (error) {
            console.error('Error in findAll:', error);
            throw error;
        }
    }
    async update(id, updateUserDto) {
        try {
            const updatedUser = await this.userModel
                .findByIdAndUpdate(id, updateUserDto, { new: true })
                .exec();
            if (!updatedUser) {
                throw new common_1.NotFoundException('User not found');
            }
            return updatedUser;
        }
        catch (error) {
            console.error('Error in update user:', error);
            throw error;
        }
    }
    async follow(userId, followId) {
        try {
            const user = await this.findById(userId);
            const followUser = await this.findById(followId);
            if (!user.following.includes(followId)) {
                user.following.push(followId);
                followUser.followers.push(userId);
                await user.save();
                await followUser.save();
            }
            return { message: 'Followed successfully' };
        }
        catch (error) {
            console.error('Error in follow:', error);
            throw error;
        }
    }
    async unfollow(userId, unfollowId) {
        try {
            const user = await this.findById(userId);
            const unfollowUser = await this.findById(unfollowId);
            user.following = user.following.filter(id => id !== unfollowId);
            unfollowUser.followers = unfollowUser.followers.filter(id => id !== userId);
            await user.save();
            await unfollowUser.save();
            return { message: 'Unfollowed successfully' };
        }
        catch (error) {
            console.error('Error in unfollow:', error);
            throw error;
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map