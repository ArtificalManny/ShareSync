export interface Post {
    projectId: string;
    userId: string;
    content: string;
    images: string[];
    likes: number;
    likedBy: string[];
    comments: number;
  }