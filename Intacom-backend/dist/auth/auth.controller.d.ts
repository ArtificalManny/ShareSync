import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: {
        identifier: string;
        password: string;
    }): Promise<{
        data: any;
    }>;
    register(userData: any): Promise<{
        message: string;
        data: Omit<import("../users/schemas/user.schema").User, "password">;
    }>;
    recover(email: string): Promise<{
        message: string;
        resetToken: string;
    }>;
    resetPassword(resetDto: {
        token: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
}
