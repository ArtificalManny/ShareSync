import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findOne(id: string): Promise<User>;
    update(id: string, updateData: Partial<User>): Promise<User>;
    findByUsername(username: string): Promise<User>;
}
