export declare class LoginDto {
    identifier: string;
    password: string;
}
export declare class RegisterDto {
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
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
    email: string;
}
