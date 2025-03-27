import { UsersService } from '@modules/users/users.service';
export declare class AuthService {
    private readonly usersService;
    constructor(usersService: UsersService);
    validateUser(identifier: string, password: string): Promise<any>;
    login(user: any): Promise<any>;
    register(user: any): Promise<any>;
    recover(email: string): Promise<{
        message: string;
        token: string;
    }>;
    reset(token: string, newPassword: string): Promise<{
        message: string;
        user: any;
    }>;
}
