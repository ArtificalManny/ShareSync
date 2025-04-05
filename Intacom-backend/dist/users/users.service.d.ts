import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    findByUsername(username: string): Promise<User>;
    findById(id: string): Promise<User>;
    findAll(): Promise<User[]>;
    update(id: string, updates: Partial<User>): Promise<User>;
    create(userData: Partial<User>): Promise<Omit<User, 'password'>>;
}
