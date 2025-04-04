import { ProjectsService } from './projects.service';
import { Project } from './schemas/project.schema';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(name: string, description: string, admin: string, color: string, sharedWith: {
        userId: string;
        role: string;
    }[]): Promise<{
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/project.schema").ProjectDocument> & Project & import("mongoose").Document<any, any, any> & {
            _id: import("mongoose").Types.ObjectId;
        };
    }>;
    findByUsername(username: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/project.schema").ProjectDocument> & Project & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    })[]>;
    findById(id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/project.schema").ProjectDocument> & Project & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    update(id: string, updates: Partial<Project>): Promise<import("mongoose").Document<unknown, {}, import("./schemas/project.schema").ProjectDocument> & Project & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    likeProject(id: string, userId: string): Promise<{
        message: string;
    }>;
}
