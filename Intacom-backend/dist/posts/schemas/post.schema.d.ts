import { Document } from 'mongoose';
export type PostDocument = Post & Document;
export declare class Comment {
    content: string;
    author: string;
    createdAt: Date;
}
export declare const CommentSchema: import("mongoose").Schema<Comment, import("mongoose").Model<Comment, any, any, any, Document<unknown, any, Comment> & Comment & {
    _id: import("mongoose").Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Comment, Document<unknown, {}, import("mongoose").FlatRecord<Comment>> & import("mongoose").FlatRecord<Comment> & {
    _id: import("mongoose").Types.ObjectId;
}>;
export declare class Post {
    projectId: string;
    content: string;
    image?: string;
    author: string;
    likes: string[];
    comments: Comment[];
    createdAt: Date;
}
export declare const PostSchema: import("mongoose").Schema<Post, import("mongoose").Model<Post, any, any, any, Document<unknown, any, Post> & Post & {
    _id: import("mongoose").Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Post, Document<unknown, {}, import("mongoose").FlatRecord<Post>> & import("mongoose").FlatRecord<Post> & {
    _id: import("mongoose").Types.ObjectId;
}>;
