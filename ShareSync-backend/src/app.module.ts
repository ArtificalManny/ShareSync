import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './projects/project.module'; // Fix path: project -> projects
import { NotificationModule } from './notification/notification.module';
import { MessageModule } from './message/message.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/sharesync'),
    AuthModule,
    UserModule,
    ProjectModule,
    NotificationModule,
    MessageModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}