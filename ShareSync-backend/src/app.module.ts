// src/app.module.ts
import { Module }            from '@nestjs/common';
import { MongooseModule }    from '@nestjs/mongoose';
import { AuthModule }        from './auth/auth.module';
import { UserModule }        from './user/user.module';
import { ProjectModule }     from './projects/project.module';
import { FeedModule }        from './feed/feed.module';
import { ProfileModule }     from './profile/profile.module';  // ← import it

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI),
    AuthModule,
    UserModule,
    ProjectModule,
    FeedModule,
    ProfileModule   // ← make sure it’s listed here
  ],
})
export class AppModule {}