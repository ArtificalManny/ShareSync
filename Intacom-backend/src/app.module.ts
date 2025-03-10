import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './routes/auth.module';
import { UploadsModule } from './uploads/uploads.module'; // Assuming you have this

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost/intacom'),
    AuthModule,
    UploadsModule,
  ],
})
export class AppModule {}