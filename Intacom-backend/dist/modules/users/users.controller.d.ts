import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: Partial<User>): Promise<{
        data: {
            user: User;
        };
    }>;
    findByUsername(username: string): Promise<{
        data: {
            user: User;
        };
    }>;
    findByEmail(email: string): Promise<{
        data: {
            user: User;
        };
    }>;
    update(id: string, updateUserDto: Partial<User>): Promise<{
        data: {
            user: User;
        };
    }>;
}
