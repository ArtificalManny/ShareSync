import { Document } from 'mongoose';
export type TaskDocument = Task & Document;
export declare class Task {
    projectId: string;
    name: string;
    description: string;
    assignee: string;
    dueDate: string;
    status: string;
}
export declare const TaskSchema: any;
