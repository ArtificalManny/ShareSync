import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './schemas/user.schema';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    create(createUserDto: CreateUserDto): Promise<UserDocument>;
    findByEmail(email: string): Promise<UserDocument | null>;
    findByUsername(username: string): Promise<UserDocument | null>;
    findById(id: string): Promise<UserDocument | null>;
    findAll(): Promise<UserDocument[]>;
    update(id: string, updateUserDto: Partial<User>): Promise<UserDocument>;
}
