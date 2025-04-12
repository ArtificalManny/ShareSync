import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findByUsername(username: string): Promise<{
        data: User;
    }>;
    findById(id: string): Promise<any>;
    findAll(): Promise<User[]>;
    update(id: string, updates: Partial<User>): Promise<User>;
}
