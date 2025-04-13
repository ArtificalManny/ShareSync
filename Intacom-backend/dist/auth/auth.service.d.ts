import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UserDocument } from '../users/schemas/user.schema';
export declare class AuthService {
    private readonly usersService;
    constructor(usersService: UsersService);
    login(loginDto: LoginDto): Promise<UserDocument>;
    register(registerDto: RegisterDto): Promise<UserDocument>;
    sendVerificationEmail(email: string, token: string): Promise<void>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(token: string, newPassword: string, email: string): Promise<void>;
    verifyEmail(token: string): Promise<void>;
}
