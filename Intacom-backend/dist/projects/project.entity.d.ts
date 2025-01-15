import { User } from '../users/user.entity';
export declare class Project {
    id: string;
    name: string;
    description?: string;
    link?: string;
    user: User;
}
