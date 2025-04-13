import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AppGateway } from '../app.gateway';
export declare class ProjectsController {
    private readonly projectsService;
    private readonly appGateway;
    constructor(projectsService: ProjectsService, appGateway: AppGateway);
    create(createProjectDto: CreateProjectDto): Promise<{
        status: string;
        message: string;
        data: any;
    }>;
    findByUsername(username: string): Promise<{
        status: string;
        data: any;
    }>;
    findById(id: string): Promise<{
        status: string;
        data: any;
    }>;
    update(id: string, updateProjectDto: UpdateProjectDto): Promise<{
        status: string;
        message: string;
        data: any;
    }>;
    remove(id: string): Promise<{
        status: string;
        message: string;
    }>;
}
