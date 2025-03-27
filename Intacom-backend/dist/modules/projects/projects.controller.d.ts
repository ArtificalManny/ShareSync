import { ProjectsService } from './projects.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ProjectsController {
    private readonly projectsService;
    private readonly notificationsService;
    constructor(projectsService: ProjectsService, notificationsService: NotificationsService);
    create(projectData: any): Promise<{
        data: {
            project: import("./project.model").Project;
        };
    }>;
    findByAdmin(admin: string): Promise<{
        data: import("./project.model").Project[];
    }>;
    findById(id: string): Promise<{
        data: {
            project: import("./project.model").Project;
        };
    }>;
}
