import { IsNotEmpty, IsString, IsArray } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsString()
  @IsNotEmpty()
  admin: string;

  @IsString()
  color: string;

  @IsArray()
  sharedWith: { userId: string; role: string }[];
}