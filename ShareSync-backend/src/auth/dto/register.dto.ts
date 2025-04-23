import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsNotEmpty()
  birthday: {
    month: string;
    day: string;
    year: string;
  };
}
export class RegisterDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  profilePicture?: string;
}