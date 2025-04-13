import { Document } from 'mongoose';
export type PostDocument = Post & Document;
export declare class Post {
    projectId: string;
    userId: string;
    content: string;
    images: string[];
    likes: number;
    likedBy: string[];
    comments: number;
}
export declare const PostSchema: any;
