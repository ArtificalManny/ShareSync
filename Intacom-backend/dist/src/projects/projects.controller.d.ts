import { ProjectsService } from '../../../Intacom-frontend/projects.service';
import { Response, Request } from 'express';
export declare class ProjectsController {
    private projectsService;
    constructor(projectsService: ProjectsService);
    getProjects(res: Response): Promise<void>;
    createProject(body: any, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    shareProject(projectId: string, body: any, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    addAnnouncement(projectId: string, body: any, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    addTask(projectId: string, body: any, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    likeAnnouncement(projectId: string, annId: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    addAnnouncementComment(projectId: string, annId: string, body: any, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    addTaskComment(projectId: string, taskId: string, body: any, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateTaskStatus(projectId: string, taskId: string, body: any, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
