import { Document } from 'mongoose';
export type PointDocument = Point & Document;
export declare class Point {
    userId: string;
    points: number;
    action: string;
}
export declare const PointSchema: any;
