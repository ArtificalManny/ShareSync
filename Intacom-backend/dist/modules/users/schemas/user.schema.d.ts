import { Document } from 'mongoose';
export type UserDocument = User & Document;
declare class Birthday {
    month: string;
    day: string;
    year: string;
}
export declare const BirthdaySchema: import("mongoose").Schema<Birthday, import("mongoose").Model<Birthday, any, any, any, Document<unknown, any, Birthday> & Birthday & {
    _id: import("mongoose").Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Birthday, Document<unknown, {}, import("mongoose").FlatRecord<Birthday>> & import("mongoose").FlatRecord<Birthday> & {
    _id: import("mongoose").Types.ObjectId;
}>;
export declare class User {
    firstName?: string;
    lastName?: string;
    username: string;
    password: string;
    email: string;
    gender?: string;
    birthday?: Birthday;
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
export {};
