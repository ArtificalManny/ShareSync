export class CreateUserDto {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  gender?: string;
  birthday?: {
    month: string;
    day: string;
    year: string;
  };
  points?: number;
  isVerified?: boolean;
  badges?: string[];
  endorsements?: string[];
  experience?: string[];
  followers?: string[];
  following?: string[];
  hobbies?: string[];
  skills?: string[];
}