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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
let AuthService = class AuthService {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async validateUser(identifier, password) {
        console.log('Validating user with identifier:', identifier);
        const user = await this.usersService.findByUsername(identifier) || await this.usersService.findByEmail(identifier);
        if (!user) {
            console.log('User not found for identifier:', identifier);
            throw new common_1.NotFoundException('User not found. Please register.');
        }
        console.log('User found:', user.email, 'with hashed password:', user.password);
        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', passwordMatch);
        if (passwordMatch) {
            const _a = user.toObject(), { password } = _a, result = __rest(_a, ["password"]);
            console.log('User validated successfully:', result.email);
            return result;
        }
        console.log('Password does not match for user:', user.email);
        throw new common_1.UnauthorizedException('Incorrect password. Please try again.');
    }
    async login(user) {
        console.log('Login successful for user:', user.email);
        return {
            data: user,
        };
    }
    async register(userData) {
        console.log('Registering user with data:', userData);
        const existingUser = await this.usersService.findByUsername(userData.username) || await this.usersService.findByEmail(userData.email);
        if (existingUser) {
            console.log('User already exists:', existingUser.email);
            throw new common_1.NotFoundException('Username or email already exists');
        }
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const newUser = await this.usersService.create(Object.assign(Object.assign({}, userData), { verificationToken, isVerified: false }));
        console.log('User registered successfully:', newUser.email);
        return {
            message: 'User registered successfully. Please verify your email.',
            data: newUser,
        };
    }
    async generateResetToken(email) {
        console.log('Generating reset token for email:', email);
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            console.log('User not found for email:', email);
            throw new common_1.NotFoundException('User not found');
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000;
        await this.usersService.update(user._id.toString(), {
            resetToken,
            resetTokenExpiry,
        });
        console.log('Reset token generated for user:', user.email, 'Token:', resetToken);
        return { resetToken };
    }
    async resetPassword(token, newPassword) {
        console.log('Resetting password with token:', token);
        const user = await this.usersService.findAll().then(users => users.find(u => u.resetToken === token));
        if (!user || user.resetTokenExpiry < Date.now()) {
            console.log('Invalid or expired reset token for token:', token);
            throw new common_1.NotFoundException('Invalid or expired reset token');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.update(user._id.toString(), {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
        });
        console.log('Password reset successfully for user:', user.email);
        return { message: 'Password reset successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], AuthService);
//# sourceMappingURL=auth.service.js.map