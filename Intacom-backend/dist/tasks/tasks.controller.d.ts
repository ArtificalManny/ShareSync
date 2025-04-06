import { TasksService } from './tasks.service';
import { Task } from './schemas/task.schema';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    create(projectId: string, name: string, description: string, assignee: string, dueDate: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/task.schema").TaskDocument> & Task & import("mongoose").Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    findByProject(projectId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/task.schema").TaskDocument> & Task & import("mongoose").Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    update(id: string, updates: Partial<Task>): Promise<import("mongoose").Document<unknown, {}, import("./schemas/task.schema").TaskDocument> & Task & import("mongoose").Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
}
