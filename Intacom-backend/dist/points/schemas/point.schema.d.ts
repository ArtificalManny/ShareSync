import { Document } from 'mongoose';
export type PointDocument = Point & Document;
export declare class Point {
    userId: string;
    points: number;
    action: string;
}
export declare const PointSchema: import("mongoose").Schema<Point, import("mongoose").Model<Point, any, any, any, Document<unknown, any, Point> & Point & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Point, Document<unknown, {}, import("mongoose").FlatRecord<Point>> & import("mongoose").FlatRecord<Point> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
