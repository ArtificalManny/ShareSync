import { AuthService } from './auth.service';
import { Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(res: Response, username: string, password: string, email: string, name: string, age: number, profilePic?: string): Promise<void>;
    login(res: Response, username: string, password: string): Promise<void>;
    recoverPassword(res: Response, email: string): Promise<void>;
    resetPassword(res: Response, token: string, newPassword: string): Promise<void>;
}
