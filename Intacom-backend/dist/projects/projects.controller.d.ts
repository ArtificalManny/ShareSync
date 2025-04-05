import { ProjectsService } from './projects.service';
import { Project } from './schemas/project.schema';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(name: string, description: string, admin: string, color: string, sharedWith: {
        userId: string;
        role: string;
    }[]): Promise<Project>;
    findById(id: string): Promise<Project>;
    findByUsername(username: string): Promise<Project[]>;
    update(id: string, name: string, description: string, color: string, sharedWith: {
        userId: string;
        role: string;
    }[], status: string, likes: number, comments: number): Promise<Project>;
    delete(id: string): Promise<void>;
    likeProject(id: string, userId: string): Promise<Project>;
}
