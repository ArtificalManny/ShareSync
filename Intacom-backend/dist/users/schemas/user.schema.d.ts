import { Document } from 'mongoose';
export type UserDocument = User & Document;
export declare class User {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    gender: string;
    birthday: {
        month: string;
        day: string;
        year: string;
    };
    points: number;
    isVerified: boolean;
    badges: string[];
    endorsements: string[];
    experience: string[];
    followers: string[];
    following: string[];
    hobbies: string[];
    skills: string[];
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User> & User & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>> & import("mongoose").FlatRecord<User> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
