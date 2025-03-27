import { Injectable } from '@nestjs/common';
import { UsersService } from '@modules/users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async validateUser(identifier: string, password: string): Promise<any> {
    const user = await this.usersService.findOne(identifier);
    if (user && user.password === password) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any): Promise<any> {
    return { data: { user } };
  }

  async register(user: any): Promise<any> {
    const newUser = await this.usersService.create(user);
    return { user: newUser };
  }

  async recover(email: string): Promise<{ message: string; token: string }> {
    // Mocked for now; in a real app, send an email with a token
    return { message: 'Recovery email sent', token: 'mock-token' };
  }

  async reset(token: string, newPassword: string): Promise<{ message: string; user: any }> {
    // Mocked for now; in a real app, validate token and update password
    const user = await this.usersService.findOne('ArtificalManny');
    if (!user) throw new Error('User not found');
    const updatedUser = await this.usersService.update(user._id, { password: newPassword });
    return { message: 'Password reset successfully', user: updatedUser };
  }
}