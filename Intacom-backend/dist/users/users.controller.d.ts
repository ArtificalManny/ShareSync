import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<import("./schemas/user.schema").UserDocument>;
    findAll(): Promise<import("./schemas/user.schema").UserDocument[]>;
    findOne(id: string): Promise<import("./schemas/user.schema").UserDocument>;
    findByUsername(username: string): Promise<import("./schemas/user.schema").UserDocument>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<import("./schemas/user.schema").UserDocument>;
    remove(id: string): Promise<void>;
    follow(id: string, followId: string): Promise<import("./schemas/user.schema").UserDocument>;
    unfollow(id: string, unfollowId: string): Promise<import("./schemas/user.schema").UserDocument>;
}
