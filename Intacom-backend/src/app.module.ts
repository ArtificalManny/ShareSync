import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AuthModule } from './modules/users/auth.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { PostsModule } from './modules/posts/posts.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/intacom'),
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
})
export class AppModule {}