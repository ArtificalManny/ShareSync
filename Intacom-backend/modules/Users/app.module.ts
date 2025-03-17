import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/users/auth.module'; // Lowercase 'users'
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    AuthModule,
    UploadsModule,
  ],
})
export class AppModule {}