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
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }
    const payload = { sub: user._id, email: user.email };
    return {
      user: { _id: user._id, email: user.email },
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(email: string, password: string) {
    console.log('AuthService: Register attempt with email:', email);
    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Provide default values for required fields
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      username: email.split('@')[0], // Default username from email
      firstName: '',
      lastName: '',
      birthday: new Date(), // Default birthday (current date)
      isVerified: false,
      badges: [],
      endorsements: [],
      followers: [],
      following: [],
      hobbies: [],
      points: 0,
    });
    return { _id: user._id, email: user.email };
  }

  async getCurrentUser(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { _id: user._id, email: user.email };
  }
}