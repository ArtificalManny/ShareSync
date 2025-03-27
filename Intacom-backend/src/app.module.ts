import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { AuthModule } from './auth/auth.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/intacom'),
    UsersModule,
    ProjectsModule,
    AuthModule,
    UploadsModule,
  ],
})
export class AppModule {}