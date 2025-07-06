// src/profile/profile.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/user.schema'; // ✅ FIXED PATH

@Injectable()
export class ProfileService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async updateProfilePicture(userId: string, filename: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { profilePicture: `uploads/${filename}` },
      { new: true }
    );
  }
}
