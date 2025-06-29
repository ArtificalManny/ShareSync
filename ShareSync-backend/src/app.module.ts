import { Module }            from '@nestjs/common';
import { MongooseModule }    from '@nestjs/mongoose';
import { AuthModule }        from './auth/auth.module';
import { UserModule }        from './user/user.module';
import { ProjectModule }     from './projects/project.module';
import { FeedModule }        from './feed/feed.module';
import { ProfileModule }     from './profile/profile.module';  // ← make sure this line is here

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI),  
    AuthModule,
    UserModule,
    ProjectModule,
    FeedModule,
    ProfileModule    // ← and that this is listed
  ],
})
export class AppModule {}