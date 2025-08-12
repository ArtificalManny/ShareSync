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

import { AppController } from './app.controller';

@Module({
  imports: [
    // Make env vars available
    ConfigModule.forRoot({ isGlobal: true }),

    // Connect to Mongo (MONGO_URI must be set)
    MongooseModule.forRoot(process.env.MONGO_URI as string),

    // Feature modules
    AuthModule,
    UserModule,
    ProjectModule,
    FeedModule,
    ProfileModule,
    ActivitiesModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}