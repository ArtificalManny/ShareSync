import { UsersService } from '../users/users.service';
export declare class AuthService {
    private usersService;
    constructor(usersService: UsersService);
    validateUser(identifier: string, password: string): Promise<any>;
    login(user: any): Promise<{
        data: any;
    }>;
    register(userData: any): Promise<{
        message: string;
        data: Omit<import("../users/schemas/user.schema").User, "password">;
    }>;
    generateResetToken(email: string): Promise<{
        resetToken: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
}
