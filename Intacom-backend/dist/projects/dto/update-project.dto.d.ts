export declare class UpdateProjectDto {
    name?: string;
    description?: string;
    admin?: string;
    color?: string;
    sharedWith?: {
        userId: string;
        role: string;
    }[];
    status?: string;
    tasks?: string[];
    timeline?: {
        startDate: string;
        endDate: string;
        milestones: {
            name: string;
            date: string;
        }[];
    };
    likes?: number;
    comments?: number;
}
