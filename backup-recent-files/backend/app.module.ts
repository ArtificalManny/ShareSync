import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './projects/project.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27018/sharesync', {
      retryAttempts: 3,
      retryDelay: 1000,
    }),
    AuthModule,
    UserModule,
    ProjectModule,
  ],
})
export class AppModule {}