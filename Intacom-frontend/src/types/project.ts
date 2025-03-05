export interface Announcement {
    id: number;
    content: string;
    media: string;
    likes: number;
    comments: { user: string; text: string }[];
    user: string;
  }
  
  export interface Task {
    id: number;
    title: string;
    assignee: string;
    dueDate: Date;
    status: string;
    comments: { user: string; text: string }[];
    user: string;
  }
  
  export interface Project {
    id: number;
    name: string;
    description: string;
    admin: string;
    sharedWith: string[];
    announcements: Announcement[];
    tasks: Task[];
  }