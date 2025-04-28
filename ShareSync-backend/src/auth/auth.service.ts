import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(payload: any): Promise<any> {
    const user = await this.userModel.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async login(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: user._id, email: user.email };
    return {
      token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(userData: any): Promise<any> {
    const { email, password, firstName, lastName } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });
    await user.save();
    const payload = { sub: user._id, email: user.email };
    return {
      token: this.jwtService.sign(payload),
      user,
    };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const token = this.jwtService.sign({ sub: user._id }, { expiresIn: '1h' });
    // In a real app, send email with reset link containing token
    console.log(`Reset token for ${email}: ${token}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    let payload;
    try {
      payload = this.jwtService.verify(token);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    const user = await this.userModel.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
  }
}