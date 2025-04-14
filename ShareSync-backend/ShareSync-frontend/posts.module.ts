import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './post.service';
import { PostsController } from './posts.controller';
import { Post } from './post.entity';
import { Project } from '../project.entity';
import { User } from '../users.user.entity';
import { Comment } from '../comments/comment.entity';
import { Like } from '../likes/like.enitity';

@Module({
    imports: [TypeOrmModule.forFeature([Post, Project, User, Comment, Like])],
    providers: [PostsService],
    controllers: [PostsController],
    exports: [PostsService],
})
export class PostsModule {}