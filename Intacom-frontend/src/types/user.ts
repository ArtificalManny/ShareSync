export interface User {
    username: string;
    password: string;
    profilePic?: string;
    id?: string; // Optional ID for Mongoose compatibility
  }