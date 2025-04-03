import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { LoginDto } from '../../users/dto/login.dto';
import { RegisterDto } from '../../users/dto/register.dto';
import { ResetPasswordDto } from '../../users/dto/reset-password.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { PointsService } from '../points/points.service';
export declare class AuthService {
    private userModel;
    private notificationsService;
    private pointsService;
    constructor(userModel: Model<UserDocument>, notificationsService: NotificationsService, pointsService: PointsService);
    login(loginDto: LoginDto): Promise<{
        data: {
            user: import("mongoose").Document<unknown, {}, UserDocument> & User & import("mongoose").Document<any, any, any> & {
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
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
