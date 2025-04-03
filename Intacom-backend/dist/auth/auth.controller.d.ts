import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        data: {
            user: import("mongoose").Document<unknown, {}, import("../users/schemas/user.schema").UserDocument> & import("../users/schemas/user.schema").User & import("mongoose").Document<any, any, any> & {
                _id: import("mongoose").Types.ObjectId;
            };
        };
    }>;
    register(registerDto: RegisterDto): Promise<{
        message: string;
    }>;
    recover(email: string): Promise<{
        message: string;
    }>;
    reset(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
