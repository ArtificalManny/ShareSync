import { Document } from 'mongoose';
export declare class User extends Document {
    username: string;
    password: string;
    profilePic?: string;
}
export declare const UserSchema: any;
