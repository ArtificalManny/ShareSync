// src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './routes/auth.module';
import { ProjectsModule } from './projects/projects.module'; // Updated to match file name
import { UploadsModule } from './uploads/uploads.module'; // Updated to match file name

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/intacom'),
    AuthModule,
    ProjectsModule,
    UploadsModule,
  ],
})
export class AppModule {}