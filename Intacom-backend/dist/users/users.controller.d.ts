import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findByUsername(username: string): Promise<{
        status: string;
        data: any;
    }>;
    findById(id: string): Promise<{
        status: string;
        data: any;
    }>;
    update(id: string, updateUserDto: any): Promise<{
        status: string;
        message: string;
        data: any;
    }>;
}
