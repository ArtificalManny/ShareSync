import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import UserModule from './user/user.module';
import { ProjectModule } from './projects/project.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/sharesync', {
      retryAttempts: 3,
      retryDelay: 1000,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000,
    }),
    AuthModule,
    UserModule,
    ProjectModule,
  ],
})
export class AppModule {}