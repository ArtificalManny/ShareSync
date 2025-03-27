import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: {
        identifier: string;
        password: string;
    }): Promise<any>;
    register(body: any): Promise<any>;
    recover(email: string): Promise<{
        message: string;
        token: string;
    }>;
    reset(body: {
        token: string;
        newPassword: string;
    }): Promise<{
        message: string;
        user: any;
    }>;
}
