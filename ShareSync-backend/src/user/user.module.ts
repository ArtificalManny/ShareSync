import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ProjectModule } from '../projects/project.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ProjectModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export default class UserModule {}