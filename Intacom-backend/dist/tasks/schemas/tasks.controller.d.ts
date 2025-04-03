import { TasksService } from './tasks.service';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    create(projectId: string, name: string, description: string, assignee: string, dueDate: string): Promise<any>;
    findByProject(projectId: string): Promise<any[]>;
    update(id: string, updates: Partial<Task>): Promise<any>;
}
