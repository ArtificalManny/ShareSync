import { Module }                from '@nestjs/common';
import { MongooseModule }        from '@nestjs/mongoose';
import { ProfileController }     from './profile.controller';
import { ProfileService }        from './profile.service';
import { User, UserSchema }      from '../user/user.schema';

@Module({
  imports: [
    // make sure we have the User schema here
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [ProfileController],  // ← must be here
  providers:   [ProfileService],     // ← must be here
})
export class ProfileModule {}