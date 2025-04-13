export class UpdateProjectDto {
  name?: string;
  description?: string;
  timeline?: { date: string; event: string }[];
}