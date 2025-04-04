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
        data: Project;
    }>;
    findByUsername(username: string): Promise<Project[]>;
    findById(id: string): Promise<import("./schemas/project.schema").ProjectDocument>;
    update(id: string, updates: Partial<Project>): Promise<Project>;
    remove(id: string): Promise<{
        message: string;
    }>;
    likeProject(id: string, userId: string): Promise<{
        message: string;
    }>;
}
