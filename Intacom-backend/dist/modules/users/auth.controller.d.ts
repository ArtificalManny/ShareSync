import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(userData: any): Promise<import("./user.model").User>;
    login(loginData: {
        identifier: string;
        password: string;
    }): Promise<import("./user.model").User>;
    recover(email: string): Promise<{
        message: string;
        token: string;
    }>;
    reset(resetData: {
        token: string;
        newPassword: string;
    }): Promise<import("./user.model").User>;
}
