import { Injectable } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async validateUser(identifier: string, password: string): Promise<any> {
    const user: UserDocument | null = await this.usersService.findByIdentifier(identifier);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    return {
      user,
    };
  }

  async recover(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    const token = Math.random().toString(36).substring(2);
    return {
      message: 'Recovery token generated',
      token,
    };
  }

  async reset(token: string, newPassword: string) {
    const user = await this.usersService.findByEmail('test@example.com');
    if (!user) {
      throw new Error('User not found');
    }
    const updatedUser = await this.usersService.update(user._id, { password: await bcrypt.hash(newPassword, 10) });
    return {
      message: 'Password reset successfully',
      user: updatedUser,
    };
  }
}