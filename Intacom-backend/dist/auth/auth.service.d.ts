import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { LoginDto, RegisterDto } from './dto/auth.dto';
export declare class AuthService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    login(loginDto: LoginDto): Promise<User>;
    register(registerDto: RegisterDto): Promise<User>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(token: string, newPassword: string, email: string): Promise<void>;
}
