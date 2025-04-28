export class CreateUserDto {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  gender: string;
  birthday: { month: string; day: string; year: string };
  bio?: string;
  skills?: string[];
  experience?: { company: string; role: string; duration: string }[];
  profilePicture?: string;
  coverPhoto?: string;
  verified?: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}