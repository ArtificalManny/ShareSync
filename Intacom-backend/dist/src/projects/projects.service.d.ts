import { Model } from 'mongoose';
import { Project } from '../models/project.model';
export declare class ProjectsService {
    private projectModel;
    constructor(projectModel: Model<Project>);
    createProject(name: string, description: string, admin: string, sharedWith?: string[], announcements?: any[], tasks?: any[]): Promise<Project>;
    findAll(): Promise<Project[]>;
    findById(id: string): Promise<Project | null>;
    shareProject(projectId: string, users: string[], admin: string): Promise<Project>;
    addAnnouncement(projectId: string, content: string, media: string, user: string): Promise<Project>;
    addTask(projectId: string, title: string, assignee: string, dueDate: Date, status: string, user: string): Promise<Project>;
    likeAnnouncement(projectId: string, annId: string, user: string): Promise<Project>;
    addAnnouncementComment(projectId: string, annId: string, text: string, user: string): Promise<Project>;
    addTaskComment(projectId: string, taskId: string, text: string, user: string): Promise<Project>;
    updateTaskStatus(projectId: string, taskId: string, status: string, user: string): Promise<Project>;
}
