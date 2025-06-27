// src/profile/profile.module.ts
import { Module }           from '@nestjs/common';
import { MongooseModule }   from '@nestjs/mongoose';
import { MulterModule }     from '@nestjs/platform-express';
import { ProfileController} from './profile.controller';
import { ProfileService }   from './profile.service';
import { User, UserSchema } from '../user/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MulterModule.register({ dest: './uploads' }),
  ],
  controllers: [ProfileController],
  providers:   [ProfileService],
})
export class ProfileModule {}
