import { ProjectsService } from './projects.service';
import { Project } from './schemas/project.schema';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(createProjectDto: Partial<Project>): Promise<{
        data: {
            project: Project;
        };
    }>;
    findByUsername(username: string): Promise<{
        data: Project[];
    }>;
    findById(id: string): Promise<{
        data: {
            project: Project;
        };
    }>;
    update(id: string, updateProjectDto: Partial<Project>): Promise<Project>;
    delete(id: string): Promise<void>;
}
