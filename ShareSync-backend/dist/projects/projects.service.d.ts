import { Model } from 'mongoose';
import { ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
export declare class ProjectsService {
    private projectModel;
    constructor(projectModel: Model<ProjectDocument>);
    create(createProjectDto: CreateProjectDto): Promise<ProjectDocument>;
    findByUsername(username: string): Promise<ProjectDocument[]>;
    findById(id: string): Promise<ProjectDocument>;
    update(id: string, updateProjectDto: UpdateProjectDto): Promise<ProjectDocument>;
    remove(id: string): Promise<void>;
}
