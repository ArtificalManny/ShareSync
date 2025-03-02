import { Model } from 'mongoose';
import { User } from '../models/user.model';
export declare class AuthService {
    private userModel;
    constructor(userModel: Model<User>);
    login(username: string, password: string): Promise<(import("mongoose").Document<unknown, {}, User> & User & {
        _id: import("mongoose").Types.ObjectId;
    }) | null>;
    register(username: string, password: string, profilePic?: string): Promise<import("mongoose").Document<unknown, {}, User> & User & {
        _id: import("mongoose").Types.ObjectId;
    }>;
}
