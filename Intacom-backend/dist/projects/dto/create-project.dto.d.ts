export declare class CreateProjectDto {
    name: string;
    description: string;
    admin: string;
    color: string;
    sharedWith: {
        userId: string;
        role: string;
    }[];
}
