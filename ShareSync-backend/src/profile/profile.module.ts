// src/profile/profile.module.ts
import { Module }          from '@nestjs/common'
import { MulterModule }    from '@nestjs/platform-express'
import { MongooseModule }  from '@nestjs/mongoose'
import { ProfileController } from './profile.controller'
import { ProfileService }    from './profile.service'
import { User, UserSchema }  from '../user/user.schema'

@Module({
  imports: [
    // tells FileInterceptor to drop uploads into ./uploads
    MulterModule.register({ dest: './uploads' }),

    // so you can update the user document
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ProfileController],
  providers:   [ProfileService],
})
export class ProfileModule {}