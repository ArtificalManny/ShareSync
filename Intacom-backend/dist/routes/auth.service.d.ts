import { Model } from 'mongoose';
import { User } from '../../models/user.model';
export declare class AuthService {
    private userModel;
    constructor(userModel: Model<User>);
    login(username: string, password: string): Promise<any>;
    register(username: string, password: string, profilePic?: string): Promise<any>;
}
