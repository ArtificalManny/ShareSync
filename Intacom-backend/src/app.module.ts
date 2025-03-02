// src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './routes/auth.module';
import { ProjectModule } from './projects/project.module'; // Updated path
import { UploadModule } from './uploads/upload.module'; // Updated path

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/intacom'),
    AuthModule,
    ProjectModule,
    UploadModule,
  ],
})
export class AppModule {}