import { AuthService } from './auth.service';
import { Response } from 'express';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: {
        username: string;
        password: string;
    }, res: Response): Promise<void>;
    register(body: {
        username: string;
        password: string;
        profilePic?: string;
    }, res: Response): Promise<void>;
}
