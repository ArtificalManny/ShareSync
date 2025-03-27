import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '@modules/users/users.module';
import { ProjectsModule } from '@modules/projects/projects.module';
import { AuthModule } from '@modules/users/auth.module';
import { UploadsModule } from '@modules/uploads/uploads.module';

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