export interface Project {
    id: string;
    name: string;
    description: string;
    admin: string;
    sharedWith: string[];
    announcements: {
      id: string;
      content: string;
      media?: string;
      user: string;
      likes: number;
      comments: { user: string; text: string; id?: string }[];
    }[];
    tasks: {
      id: string;
      title: string;
      assignee: string;
      dueDate: Date;
      status: string;
      user: string;
      comments: { user: string; text: string; id?: string }[];
    }[];
  }