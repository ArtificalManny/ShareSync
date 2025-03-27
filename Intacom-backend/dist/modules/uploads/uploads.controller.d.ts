import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
export declare class ProjectsService {
    private projectModel;
    constructor(projectModel: Model<ProjectDocument>);
    create(createProjectDto: Partial<Project>): Promise<Project>;
    findByUsername(username: string): Promise<Project[]>;
    findById(id: string): Promise<Project | null>;
    update(id: string, updateProjectDto: Partial<Project>): Promise<Project | null>;
    delete(id: string): Promise<void>;
}
