import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { DevAuthController } from './dev-auth.controller';
import { AuthService } from './auth.service';

import { User, UserSchema } from '../user/schemas/user.schema';
import { UserModule } from '../user/user.module';
import { MailerConfigModule } from '../mailer/mailer.module';

// IMPORTANT: use the REAL strategy file, not the barrel
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleDeleteStrategy } from './strategies/google-delete.strategy';
import { GoogleDeleteGuard } from './guards/google-delete.guard';

@Module({
  imports: [
    ConfigModule,
    MailerConfigModule,
    forwardRef(() => UserModule),
    PassportModule,

    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev_secret_change_me'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),
  ],
  controllers: [AuthController, DevAuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    GoogleDeleteStrategy,
    GoogleDeleteGuard,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
