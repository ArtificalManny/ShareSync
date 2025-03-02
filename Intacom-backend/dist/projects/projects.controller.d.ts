import { ProjectsService } from '../../../Intacom-frontend/projects.service';
import { Response, Request } from 'express';
export declare class ProjectsController {
    private projectsService;
    constructor(projectsService: ProjectsService);
    getProjects(res: Response): Promise<void>;
    createProject(body: any, req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    shareProject(projectId: string, body: any, req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    addAnnouncement(projectId: string, body: any, req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    addTask(projectId: string, body: any, req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    likeAnnouncement(projectId: string, annId: string, req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    addAnnouncementComment(projectId: string, annId: string, body: any, req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    addTaskComment(projectId: string, taskId: string, body: any, req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateTaskStatus(projectId: string, taskId: string, body: any, req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
