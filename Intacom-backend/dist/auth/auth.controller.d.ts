import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    test(): Promise<{
        message: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        status: string;
        message: string;
        data: import("../users/schemas/user.schema").User;
    }>;
    register(registerDto: RegisterDto): Promise<{
        status: string;
        message: string;
        data: import("../users/schemas/user.schema").User;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        status: string;
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        status: string;
        message: string;
    }>;
}
