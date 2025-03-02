import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './routes/auth.module';
import { ProjectModule } from './routes/project.module';
import { UploadModule } from './routes/upload.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/intacom'),
    AuthModule,
    ProjectModule,
    UploadModule,
  ],
})
export class AppModule {}