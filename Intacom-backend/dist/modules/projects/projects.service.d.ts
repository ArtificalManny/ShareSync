import { Model } from 'mongoose';
import { Project } from './project.model';
export declare class ProjectsService {
    private readonly projectModel;
    constructor(projectModel: Model<Project>);
    create(projectData: any): Promise<Project>;
    findByAdmin(admin: string): Promise<Project[]>;
}
