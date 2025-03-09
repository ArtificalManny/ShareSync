import { ProjectsService } from './projects.service';
import { Response } from 'express';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    createProject(res: Response, name: string, description: string, admin: string, color?: string): Promise<void>;
    getUserProjects(res: Response, username: string): Promise<void>;
    addMember(res: Response, projectId: string, username: string, role: 'member' | 'administrator'): Promise<void>;
}
