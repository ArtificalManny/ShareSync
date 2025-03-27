import { ProjectsService } from './projects.service';
import { Project } from '../modules/projects/schemas/project.schema';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    findById(id: string): Promise<{
        data: {
            project: Project;
        };
    }>;
    findByAdmin(admin: string): Promise<{
        data: Project[];
    }>;
    create(project: Partial<Project>): Promise<Project>;
}
