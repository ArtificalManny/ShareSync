// src/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config'; // ✅ Added for env config

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

import { UserModule } from '../user/user.module';
import { User, UserSchema } from '../user/user.schema';
import { RefreshToken, RefreshTokenSchema } from './refresh-token.schema';

@Module({
  imports: [
    ConfigModule, // ✅ Make sure this is here so we can inject configService below

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule], // ✅ Inject ConfigModule into this async setup
      inject: [ConfigService], // ✅ Inject ConfigService to access env variables
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // ✅ Safely access env var
        signOptions: { expiresIn: '1h' },
      }),
    }),

    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),

    forwardRef(() => UserModule),
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}