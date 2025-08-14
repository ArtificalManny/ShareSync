// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './projects/project.module';
import { FeedModule } from './feed/feed.module';
import { ProfileModule } from './profile/profile.module';
import { ActivitiesModule } from './activities/activities.module';
import { RealtimeModule } from './realtime/realtime.module';

import { DigestModule } from './digest/digest.module';
import { MailerConfigModule } from './mailer/mailer.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    // Feature modules
    AuthModule,
    UserModule,
    ProjectModule,
    FeedModule,
    ProfileModule,
    ActivitiesModule,
    RealtimeModule,
    // Mail + Digest
    MailerConfigModule,
    DigestModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}