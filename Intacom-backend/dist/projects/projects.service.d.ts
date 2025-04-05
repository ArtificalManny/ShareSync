import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
export declare class ProjectsService {
    private projectModel;
    constructor(projectModel: Model<ProjectDocument>);
    create(projectData: Partial<Project>): Promise<Project>;
    findById(id: string): Promise<Project>;
    findByUsername(username: string): Promise<Project[]>;
    update(id: string, updates: Partial<Project>): Promise<Project>;
    delete(id: string): Promise<void>;
    likeProject(id: string, userId: string): Promise<Project>;
}
