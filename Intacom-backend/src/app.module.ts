import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { AuthModule } from './auth/auth.module';
import { UploadsModule } from './uploads/uploads.module';
import { ActivitiesModule } from './activities/activities.module';
import { PostsModule } from './posts/posts.module';
import { EmailService } from './email/email.service';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    UsersModule,
    ProjectsModule,
    AuthModule,
    UploadsModule,
    ActivitiesModule,
    PostsModule,
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class AppModule {}