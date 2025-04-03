import { Model } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
export declare class TasksService {
    private taskModel;
    constructor(taskModel: Model<TaskDocument>);
    create(projectId: string, name: string, description: string, assignee: string, dueDate: string): Promise<import("mongoose").Document<unknown, {}, TaskDocument> & Task & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    findByProject(projectId: string): Promise<(import("mongoose").Document<unknown, {}, TaskDocument> & Task & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    })[]>;
    update(id: string, updates: Partial<TaskDocument>): Promise<import("mongoose").Document<unknown, {}, TaskDocument> & Task & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
}
