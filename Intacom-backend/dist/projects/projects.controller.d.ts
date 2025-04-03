import { ProjectsService } from './projects.service';
import { Project } from './schemas/project.schema';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(name: string, description: string, admin: string, color: string, sharedWith: {
        userId: string;
        role: string;
    }[]): Promise<any>;
    findByUsername(username: string): Promise<any[]>;
    findById(id: string): Promise<any>;
    update(id: string, updates: Partial<Project>): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
    likeProject(id: string, userId: string): Promise<{
        message: string;
    }>;
}
