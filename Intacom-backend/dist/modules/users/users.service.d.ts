import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<User>);
    findOne(identifier: string): Promise<User | null>;
    create(user: Partial<User>): Promise<User>;
    update(id: string, updateData: Partial<User>): Promise<User | null>;
}
