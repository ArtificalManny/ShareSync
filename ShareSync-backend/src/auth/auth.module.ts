import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { ResetTokenSchema } from '../reset-token/reset-token.schema';

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
  exports: [AuthService], // Ensure AuthService is exported if needed elsewhere
})
export class AuthModule {}