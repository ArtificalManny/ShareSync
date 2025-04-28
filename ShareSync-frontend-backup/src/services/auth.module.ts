import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '../../../ShareSync-backend/src/auth/auth.service';
import { AuthController } from '../../../ShareSync-backend/src/auth/auth.controller';
import { UsersModule } from '../../../ShareSync-backend/src/user/users.module';
import { ResetTokenSchema } from '../../../ShareSync-backend/src/reset-token/reset-token.schema';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_jwt_secret',
      signOptions: { expiresIn: '1h' },
    }),
    MongooseModule.forFeature([{ name: 'ResetToken', schema: ResetTokenSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule], // Export JwtModule to make JwtService available
})
export class AuthModule {}