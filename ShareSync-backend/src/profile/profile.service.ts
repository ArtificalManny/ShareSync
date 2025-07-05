// src/profile/profile.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/user.schema';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async updateProfilePicture(userId: string, file: Express.Multer.File) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { profilePicture: file.path }, // ✅ uses correct schema field
      { new: true }
    );
    return updatedUser;
  }
}