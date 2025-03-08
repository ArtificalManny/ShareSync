import { Model } from 'mongoose';
import { User } from '../../../models/user.model';
export declare class AuthService {
    private userModel;
    constructor(userModel: Model<User>);
    register(username: string, password: string, email: string, name: string, age: number, profilePic?: string): Promise<User>;
    login(username: string, password: string): Promise<User>;
    findUser(username: string): Promise<User | null>;
    recoverPassword(email: string): Promise<{
        message: string;
        token: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<User>;
}
