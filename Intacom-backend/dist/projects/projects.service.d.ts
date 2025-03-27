import { Model } from 'mongoose';
import { Project } from '../modules/projects/schemas/project.schema';
export declare class ProjectsService {
    private projectModel;
    constructor(projectModel: Model<Project>);
    findById(id: string): Promise<Project | null>;
    findByAdmin(admin: string): Promise<Project[]>;
    create(project: Partial<Project>): Promise<Project>;
}
