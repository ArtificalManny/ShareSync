export class LoginDto {
    identifier: string;
    password: string;
  }
  
  export class RegisterDto {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    gender: string;
    birthday: {
      month: string;
      day: string;
      year: string;
    };
  }
  
  export class ForgotPasswordDto {
    email: string;
  }
  
  export class ResetPasswordDto {
    token: string;
    newPassword: string;
    email: string; // Added email field for user-specific reset.
  }