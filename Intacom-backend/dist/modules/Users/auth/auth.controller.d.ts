import { AuthService } from './auth.service';
import { Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(res: Response, firstName: string, lastName: string, username: string, password: string, email: string, gender: string, birthday: {
        month: string;
        day: string;
        year: string;
    }, profilePic?: string): Promise<void>;
    login(res: Response, identifier: string, password: string): Promise<void>;
    recoverPassword(res: Response, email: string): Promise<void>;
    resetPassword(res: Response, token: string, newPassword: string): Promise<void>;
}
export { AuthController };
