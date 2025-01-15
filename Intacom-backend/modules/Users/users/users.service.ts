import { Injectable, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
//Import User entity and DTOs
import { User } from '../../../../Intacom-frontend/src/users/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getUserProfile(userId: string): Promise<any> {
    const user = await this.usersRepository.findOne(userId, { relations: ['experiences', 'education', 'projects'] });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUserProfile(userId: string, updateData: any): Promise<any> {
    await this.usersRepository.update(userId, updateData);
    return this.getUserProfile(userId);
  }

  async updateProfileImage(userId: string, filename: string): Promise<any> {
    await this.usersRepository.update(userId, { profilePicture: `/uploads/profile/${filename}` });
    return this.getUserProfile(userId);
  }

  async updateCoverImage(userId: string, filename: string): Promise<any> {
    await this.usersRepository.update(userId, { coverImage: `/uploads/cover/${filename}` });
    return this.getUserProfile(userId);
  }
}
