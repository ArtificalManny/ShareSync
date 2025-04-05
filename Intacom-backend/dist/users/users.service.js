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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./schemas/user.schema");
const bcrypt = __importStar(require("bcrypt"));
let UsersService = class UsersService {
    constructor(userModel) {
        this.userModel = userModel;
    }
    async findByUsername(username) {
        try {
            const user = await this.userModel
                .findOne({ username })
                .select('-password')
                .lean()
                .exec();
            if (!user) {
                throw new common_1.NotFoundException(`User with username ${username} not found`);
            }
            return user;
        }
        catch (error) {
            console.error('Error in findByUsername:', error);
            throw error;
        }
    }
    async findById(id) {
        try {
            const user = await this.userModel
                .findById(id)
                .select('-password')
                .lean()
                .exec();
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
            return await this.userModel
                .find()
                .select('-password')
                .lean()
                .exec();
        }
        catch (error) {
            console.error('Error in findAll:', error);
            throw error;
        }
    }
    async update(id, updates) {
        try {
            const updatedUser = await this.userModel
                .findByIdAndUpdate(id, updates, { new: true })
                .select('-password')
                .lean()
                .exec();
            if (!updatedUser) {
                throw new common_1.NotFoundException('User not found');
            }
            return updatedUser;
        }
        catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }
    async create(userData) {
        try {
            const hashedPassword = await bcrypt.hash(userData.password || '', 10);
            const newUser = new this.userModel(Object.assign(Object.assign({}, userData), { password: hashedPassword }));
            const savedUser = await newUser.save();
            const _a = savedUser.toObject(), { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
            return userWithoutPassword;
        }
        catch (error) {
            console.error('Error in create:', error);
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