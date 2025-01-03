import { Module } from '@nestjs/commmon';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { PostsModule } from './posts/posts.module';
import { AuthModule } from '/auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { LikesModule } from './likes/likes.module';
import { MulterModule } from '@nestjs/platform-express';
import { join } from 'path';

@@Module({
    imports: [
      TypeOrmModule.forRoot({
        // ... your TypeORM configuration
      }),
      UsersModule,
      MulterModule.register({
        dest: join(__dirname, '..', 'uploads'),
      }),
    ],
    controllers: [],
    providers: [],
  })
  export class AppModule {}  