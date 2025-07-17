// src/projects/dto/create-project.dto.ts

export class CreateProjectDto {
    title: string;
    description: string;
    category: string;
    status: string;
    privacy: string;
    userId: string; // injected from req.user.userId
    members?: { email: string; role: string }[];
  }
  