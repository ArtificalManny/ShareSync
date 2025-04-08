import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: {
        identifier: string;
        password: string;
    }): Promise<{
        data: any;
    }>;
    register(registerDto: any): Promise<{
        message: string;
        data: import("../users/schemas/user.schema").User;
    }>;
    forgotPassword(email: string): Promise<{
        resetToken: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
}
