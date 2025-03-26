import { ProjectsService } from './projects.service';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(projectData: any): Promise<import("./project.model").Project>;
    findByAdmin(admin: string): Promise<import("./project.model").Project[]>;
}
