import { Document } from 'mongoose';
export type UserDocument = User & Document;
export declare class User {
    firstName?: string;
    lastName?: string;
    username: string;
    password: string;
    email: string;
    gender?: string;
    birthday?: {
        month: string;
        day: string;
        year: string;
    };
    profilePic?: string;
    coverPhoto?: string;
    bio?: string;
    school?: string;
    occupation?: string;
    hobbies?: string[];
    settings?: {
        emailNotifications: boolean;
        postNotifications: boolean;
        commentNotifications: boolean;
        likeNotifications: boolean;
        taskNotifications: boolean;
        memberRequestNotifications: boolean;
        theme: string;
        privacy: string;
    };
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User> & User & {
    _id: import("mongoose").Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>> & import("mongoose").FlatRecord<User> & {
    _id: import("mongoose").Types.ObjectId;
}>;
