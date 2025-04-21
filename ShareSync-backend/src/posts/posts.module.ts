import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsService } from './posts.service';
import { Post, PostSchema } from '../schemas/post.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { Notification, NotificationSchema } from '../notifications/schemas/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  providers: [PostsService, NotificationsService],
  exports: [PostsService],
})
export class PostsModule {}