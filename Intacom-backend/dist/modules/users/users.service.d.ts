import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    create(createUserDto: Partial<User>): Promise<User>;
    findByUsername(username: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByIdentifier(identifier: string): Promise<User | null>;
    update(id: string, updateUserDto: Partial<User>): Promise<User | null>;
}
