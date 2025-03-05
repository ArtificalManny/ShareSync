import { Model } from 'mongoose';
import { Project } from '../../models/project.model';
export declare class ProjectsService {
    private projectModel;
    constructor(projectModel: Model<Project>);
    getProjects(): Promise<any[]>;
    createProject(body: any, admin: string): Promise<any>;
    shareProject(projectId: string, username: string, users: string[]): Promise<any>;
    addAnnouncement(projectId: string, username: string, body: any): Promise<any>;
    addTask(projectId: string, username: string, body: any): Promise<any>;
    likeAnnouncement(projectId: string, annId: number): Promise<any>;
    addAnnouncementComment(projectId: string, annId: number, username: string, body: any): Promise<any>;
    addTaskComment(projectId: string, taskId: number, username: string, body: any): Promise<any>;
    updateTaskStatus(projectId: string, taskId: number, username: string, status: string): Promise<any>;
}
