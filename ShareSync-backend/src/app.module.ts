// src/app.module.ts
import { Module }             from '@nestjs/common';
import { ConfigModule }       from '@nestjs/config';
import { MongooseModule }     from '@nestjs/mongoose';
import { AuthModule }         from './auth/auth.module';
import { UserModule }         from './user/user.module';
import { ProjectModule }      from './projects/project.module';
import { FeedModule }         from './feed/feed.module';
import { ProfileModule }      from './profile/profile.module';
import { ActivitiesModule }   from './activities/activities.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),      // ← make process.env.* available
    MongooseModule.forRoot(process.env.MONGO_URI), // ← now it’s defined
    AuthModule,
    UserModule,
    ProjectModule,
    FeedModule,
    ProfileModule,
    ActivitiesModule,
  ],
})
export class AppModule {}