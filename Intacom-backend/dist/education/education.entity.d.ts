import { User } from '../user.entity';
export declare class Education {
    id: string;
    degree: string;
    school: string;
    startDate?: Date;
    endDate?: Date;
    user: User;
}
