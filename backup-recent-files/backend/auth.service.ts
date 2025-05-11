import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: { email: string; username: string; password: string; firstName: string; lastName: string }) {
    const existingUser = await this.userService.findOneByEmail(registerDto.email);
    if (existingUser) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.userService.create({
      ...registerDto,
      password: hashedPassword,
    });
    const payload = { sub: user._id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
    };
  }

  async login(loginDto: { email: string; password: string }) {
    const user = await this.userService.findOneByEmail(loginDto.email);
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    const payload = { sub: user._id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const token = this.jwtService.sign({ email }, { expiresIn: '1h' });
    console.log(`Password reset token for ${email}: ${token}`);
  }

  async resetPassword(token: string, newPassword: string) {
    let payload;
    try {
      payload = this.jwtService.verify(token);
    } catch (error) {
      throw new HttpException('Invalid or expired token', HttpStatus.BAD_REQUEST);
    }
    const user = await this.userService.findOneByEmail(payload.email);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userService.update(user._id.toString(), { password: hashedPassword });
  }
}