import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    create(createUserDto: Partial<User>): Promise<UserDocument>;
    findByUsername(username: string): Promise<UserDocument | null>;
    findByEmail(email: string): Promise<UserDocument | null>;
    findByIdentifier(identifier: string): Promise<UserDocument | null>;
    update(id: string, updateUserDto: Partial<User>): Promise<UserDocument | null>;
}
