// src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule }     from './auth/auth.module';
import { UserModule }     from './user/user.module';
import { ProjectModule }  from './projects/project.module';
import { ProfileModule }  from './profile/profile.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost/sharesync'),
    AuthModule,
    UserModule,
    ProjectModule,
    ProfileModule,   // ← add this
  ],
})
export class AppModule {}
