import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findByUsername(username: string): Promise<{
        status: string;
        data: import("./schemas/user.schema").UserDocument;
    }>;
    findById(id: string): Promise<{
        status: string;
        data: import("./schemas/user.schema").UserDocument;
    }>;
}
