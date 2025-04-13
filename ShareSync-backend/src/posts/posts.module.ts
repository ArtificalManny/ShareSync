import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post, PostSchema } from './schemas/post.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { PointsService } from '../points/points.service';
import { Notification, NotificationSchema } from '../notifications/schemas/notification.schema';
import { Point, PointSchema } from '../points/schemas/point.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UsersModule } from '../users/users.module';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Point.name, schema: PointSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UsersModule,
    PointsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, NotificationsService, PointsService],
})
export class PostsModule {}