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

  /** Validate email/password and return the user (without password) */
  public async validateUser(email: string, password: string) {
    const user = await this.userModel
      .findOne({ email })
      .lean<UserDocument & { password?: string }>();

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

  /** Validate by id (used by JwtStrategy) */
  public async validateUserById(userId: string) {
    const user = await this.userModel.findById(userId).lean<UserDocument>();
    if (!user) throw new UnauthorizedException('Invalid token');
    const { password: _pw, ...safe } = user as any;
    return safe;
  }

  /** Issue JWT and return it along with the safe user object */
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = {
      sub: String((user as any)._id),
      email: (user as any).email,
      ...(user && (user as any).roles && { roles: (user as any).roles }),
      ...((user as any).firstName && { firstName: (user as any).firstName }),
      ...((user as any).lastName && { lastName: (user as any).lastName }),
      ...((user as any).username && { username: (user as any).username }),
    };

    const access_token = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'dev_secret_change_me',
      expiresIn: '7d',
    });

    return {
      access_token,
      user: {
        _id: (user as any)._id,
        email: (user as any).email,
        firstName: (user as any).firstName || '',
        lastName: (user as any).lastName || '',
        username: (user as any).username || '',
        roles: (user as any).roles || [],
      },
    };
  }
}
