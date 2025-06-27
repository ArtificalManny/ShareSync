// src/profile/profile.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model }       from 'mongoose';
import { User, UserDocument } from '../user/user.schema';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async updateProfilePicture(userId: string, file: Express.Multer.File) {
    const publicPath = `/uploads/${file.filename}`;
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { profilePicture: publicPath },
        { new: true },
      )
      .lean();
  }
}
