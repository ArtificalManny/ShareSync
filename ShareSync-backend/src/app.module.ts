import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { NotificationModule } from './notification/notification.module';
import { TeamActivityModule } from './teamActivity/teamActivity.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://ClusterZero:NR8P0FLTk0JWLA@cluster0.z7xm8.mongodb.net/sharesync?retryWrites=true&w=majority&appName=Cluster0'),
    AuthModule,
    UserModule,
    ProjectModule,
    NotificationModule,
    TeamActivityModule,
  ],
})
export class AppModule {}