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

  /** Validate email/password and return the user (without password) */
  public async validateUser(email: string, password: string) {
    console.log('🔵 VALIDATE USER CALLED');
    console.log('🔵 email type:', typeof email, 'value:', email);
    console.log('🔵 password type:', typeof password, 'length:', password?.length);
    
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
    console.log('🔵 LOGIN SERVICE CALLED');
    console.log('🔵 email type:', typeof email, 'value:', email);
    console.log('🔵 password type:', typeof password, 'length:', password?.length);
    
    const user = await this.validateUser(email, password);

    // ✅ FIXED: Only include fields that definitely exist
    const payload = { 
      sub: String(user._id), 
      email: user.email,
      ...(user.roles && { roles: user.roles }),
      ...(user.firstName && { firstName: user.firstName }),
      ...(user.lastName && { lastName: user.lastName }),
      ...(user.username && { username: user.username })
    };
    
    const access_token = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'dev_secret_change_me',
      expiresIn: '7d',
    });

    console.log('🟢 LOGIN SUCCESS - Token generated');

    // ✅ Return clean user object
    return { 
      access_token, 
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        roles: user.roles || []
      }
    };
  }
}
