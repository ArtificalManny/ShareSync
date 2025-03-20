import { Model } from 'mongoose';
import { User } from './user.model';
export declare class AuthService {
    private readonly userModel;
    constructor(userModel: Model<User>);
    register(userData: any): Promise<User>;
    login(identifier: string, password: string): Promise<User>;
    recover(email: string): Promise<{
        message: string;
        token: string;
    }>;
    reset(token: string, newPassword: string): Promise<User>;
}
