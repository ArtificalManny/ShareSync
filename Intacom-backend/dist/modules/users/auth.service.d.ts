import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
export declare class AuthService {
    private readonly usersService;
    constructor(usersService: UsersService);
    validateUser(identifier: string, password: string): Promise<any>;
    login(user: any): Promise<{
        user: any;
    }>;
    register(userDto: Partial<User>): Promise<any>;
    recover(email: string): Promise<{
        message: string;
        token: string;
    }>;
    reset(token: string, newPassword: string): Promise<{
        message: string;
        user: User;
    }>;
}
