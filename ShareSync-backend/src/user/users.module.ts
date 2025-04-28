import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './user.service';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  providers: [UsersService],
  exports: [
    UsersService,
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]), // Export the model
  ],
})
export class UsersModule {}