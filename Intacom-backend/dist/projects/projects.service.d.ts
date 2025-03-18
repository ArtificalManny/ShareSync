import { Model } from 'mongoose';
import { Project } from '../models/project.model';
export declare class ProjectsService {
    private projectModel;
    constructor(projectModel: Model<Project>);
    createProject(name: string, description: string, admin: string, color?: string): Promise<Project>;
    getUserProjects(username: string): Promise<Project[]>;
    addMember(projectId: string, username: string, role: 'member' | 'administrator'): Promise<Project>;
}
