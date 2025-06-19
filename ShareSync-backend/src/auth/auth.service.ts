import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import { RefreshToken, RefreshTokenDocument } from './refresh-token.schema';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  Core credential check used by Passport-local                       */
  /* ------------------------------------------------------------------ */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findOneByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    // strip out password before returning to Passport
    const { password: _pw, ...safeUser } =
      typeof user.toObject === 'function' ? user.toObject() : user;
    return safeUser;
  }

  /* ------------------------------------------------------------------ */
  /*  Login                                                              */
  /* ------------------------------------------------------------------ */
  async login(loginDto: { email: string; password: string }) {
    const { email, password } = loginDto;
    const user = await this.userService.findOneByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user._id.toString(), email: user.email };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = await this.generateRefreshToken(user._id.toString());

    return {
      access_token,
      refresh_token,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Register                                                           */
  /* ------------------------------------------------------------------ */
  async register(registerDto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const { email, password, firstName, lastName } = registerDto;

    const existing = await this.userService.findOneByEmail(email);
    if (existing) throw new UnauthorizedException('Email already exists');

    const user = await this.userService.create({
      email,
      username: email.split('@')[0],
      password,
      firstName,
      lastName,
    });

    const payload = { sub: user._id.toString(), email: user.email };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = await this.generateRefreshToken(user._id.toString());

    return {
      access_token,
      refresh_token,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Refresh-token flow                                                */
  /* ------------------------------------------------------------------ */
  async refreshToken(refreshToken: string) {
    const tokenDoc = await this.refreshTokenModel
      .findOne({ token: refreshToken })
      .exec();
    if (!tokenDoc || new Date() > tokenDoc.expiresAt) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userService.findById(tokenDoc.userId);
    if (!user) throw new UnauthorizedException('User not found');

    const payload = { sub: user._id.toString(), email: user.email };
    const access_token = this.jwtService.sign(payload);
    return { access_token };
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await new this.refreshTokenModel({ userId, token, expiresAt }).save();
    return token;
  }

  /* ------------------------------------------------------------------ */
  /*  Misc utilities (forgot/reset)                                     */
  /* ------------------------------------------------------------------ */
  async forgotPassword(email: string) {
    const user = await this.userService.findOneByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');
    return { message: 'Password reset link sent' };
  }

  async resetPassword(email: string, newPassword: string) {
    const user = await this.userService.findOneByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userService.update(user._id.toString(), { password: hashed });
    return { message: 'Password reset successful' };
  }
}
