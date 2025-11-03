// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwt: JwtService,
  ) {}

  /** Validate email/password and return the user (without password).
   *  NOTE: public so LocalStrategy can call it.
   */
  public async validateUser(email: string, password: string) {
    const user = await this.userModel.findOne({ email }).lean<UserDocument & { password?: string }>();
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const stored = user.password || '';
    let ok = false;

    // If hashed with bcrypt, compare; else plain compare (dev-only).
    if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
      ok = await bcrypt.compare(password, stored);
    } else {
      ok = stored === password;
    }

    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const { password: _pw, ...safe } = user as any;
    return safe;
  }

  /** Issue JWT and return it along with the safe user object */
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = { sub: String(user._id), email: user.email, roles: user.roles || [] };
    const token = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'dev_secret_change_me',
      expiresIn: '7d',
    });

    return { token, user };
  }
}
