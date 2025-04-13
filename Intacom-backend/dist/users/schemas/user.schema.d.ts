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
export declare const UserSchema: any;
