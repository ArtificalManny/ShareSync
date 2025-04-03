import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(createProjectDto: CreateProjectDto): Promise<any>;
    findByUsername(username: string): Promise<{
        data: any;
    }>;
    findOne(id: string): any;
    update(id: string, updateProjectDto: UpdateProjectDto): Promise<any>;
    remove(id: string): any;
}
