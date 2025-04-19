import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    console.log('AuthService: Login attempt with identifier:', email);
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      console.log('AuthService: User not found for identifier:', email);
      throw new UnauthorizedException('Invalid username or password');
    }
    console.log('AuthService: Found user:', user.email, 'with password hash:', user.password);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('AuthService: Password comparison result:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('AuthService: Password comparison failed for user:', email);
      throw new UnauthorizedException('Invalid username or password');
    }
    const payload = { sub: user._id, email: user.email };
    return {
      user: { _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(userData: { email: string; password: string; username?: string; firstName?: string; lastName?: string; birthday?: string }) {
    console.log('AuthService: Register attempt with email:', userData.email);
    const existingUser = await this.usersService.findOneByEmail(userData.email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await this.usersService.create({
      email: userData.email,
      password: hashedPassword,
      username: userData.username || userData.email.split('@')[0],
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      birthday: userData.birthday ? new Date(userData.birthday) : undefined,
      isVerified: false,
      badges: [],
      endorsements: [],
      followers: [],
      following: [],
      hobbies: [],
      points: 0,
      notifications: [],
    });
    return { _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName };
  }

  async getCurrentUser(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName };
  }
}