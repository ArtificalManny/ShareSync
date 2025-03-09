import { Model } from 'mongoose';
import { User } from '../../models/user.model';
export declare class AuthService {
    private userModel;
    constructor(userModel: Model<User>);
    register(firstName: string, lastName: string, username: string, password: string, email: string, gender: string, birthday: {
        month: string;
        day: string;
        year: string;
    }, profilePic?: string): Promise<User>;
    login(identifier: string, password: string): Promise<User>;
    findUser(identifier: string): Promise<User | null>;
    recoverPassword(email: string): Promise<{
        message: string;
        token: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<User>;
}
