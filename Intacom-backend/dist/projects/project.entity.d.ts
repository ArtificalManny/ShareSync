import { User } from '../user.entity';
export declare class Project {
    id: string;
    name: string;
    description?: string;
    link?: string;
    user: User;
}
