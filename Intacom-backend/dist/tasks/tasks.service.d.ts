import { Model } from 'mongoose';
import { TaskDocument } from './schemas/task.schema';
export declare class TasksService {
    private taskModel;
    constructor(taskModel: Model<TaskDocument>);
    create(projectId: string, name: string, description: string, assignee: string, dueDate: string): Promise<any>;
    findByProject(projectId: string): Promise<any[]>;
    update(id: string, updates: Partial<TaskDocument>): Promise<any>;
}
