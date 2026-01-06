// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from '../user/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwt: JwtService,
  ) {}

  // ============================================
  // REGISTER (ENHANCED - Keep your structure + Add refresh token)
  // ============================================
  async register(registerDto: RegisterDto) {
    const { email, username, password, firstName, lastName, gender, birthday, profilePicture } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already registered');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Username already taken');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.userModel.create({
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
      profilePicture,
      // Additional fields from your RegisterDto
      // gender and birthday can be stored if you add them to schema
      isEmailVerified: false, // You can add email verification later
    });

    // Generate tokens
    const tokens = await this.generateTokens(user._id.toString(), user.email);

    // Save refresh token to user
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      tokens,
      message: 'User created successfully',
    };
  }

  // ============================================
  // VALIDATE USER (Your existing logic - Enhanced)
  // ============================================
  async validateUser(email: string, password: string) {
    console.log('🔵 VALIDATE USER CALLED');
    console.log('🔵 email type:', typeof email, 'value:', email);
    console.log('🔵 password type:', typeof password, 'length:', password?.length);
    
    const user = await this.userModel.findOne({ email }).lean<UserDocument & { password?: string }>();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (user.isActive === false) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const stored = user.password || '';
    let ok = false;

    // If hashed with bcrypt, compare; else plain compare (dev-only).
    if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
      ok = await bcrypt.compare(password, stored);
    } else {
      ok = stored === password;
    }

    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _pw, ...safe } = user as any;
    return safe;
  }

  // ============================================
  // LOGIN (Your existing + Enhanced with refresh tokens)
  // ============================================
  async login(email: string, password: string) {
    console.log('🔵 LOGIN SERVICE CALLED');
    console.log('🔵 email type:', typeof email, 'value:', email);
    console.log('🔵 password type:', typeof password, 'length:', password?.length);
    
    const user = await this.validateUser(email, password);

    // Generate tokens (both access and refresh)
    const tokens = await this.generateTokens(String(user._id), user.email);

    // Save refresh token to user
    await this.updateRefreshToken(String(user._id), tokens.refreshToken);

    // Update last login
    await this.userModel.findByIdAndUpdate(user._id, {
      lastLogin: new Date(),
    });

    console.log('🟢 LOGIN SUCCESS - Tokens generated');

    // Return clean user object + tokens
    return { 
      access_token: tokens.accessToken, // Keep for backwards compatibility
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        profilePicture: user.profilePicture,
        xp: user.xp || 0,
        level: user.level || 1,
        streakDays: user.streakDays || 0,
      }
    };
  }

  // ============================================
  // REFRESH TOKENS (NEW)
  // ============================================
  async refreshTokens(userId: string, refreshToken: string) {
    // Find user
    const user = await this.userModel.findById(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    // Verify refresh token matches
    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access denied');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user._id.toString(), user.email);

    // Update refresh token
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return tokens;
  }

  // ============================================
  // LOGOUT (NEW)
  // ============================================
  async logout(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: null,
    });

    return { message: 'Logged out successfully' };
  }

  // ============================================
  // GENERATE TOKENS (NEW - Access + Refresh)
  // ============================================
  private async generateTokens(userId: string, email: string) {
    const payload = { 
      sub: userId, 
      email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      // Access token (short-lived)
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'dev_secret_change_me',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      }),
      // Refresh token (long-lived)
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  // ============================================
  // UPDATE REFRESH TOKEN (NEW)
  // ============================================
  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  // ============================================
  // SANITIZE USER (NEW - Remove sensitive data)
  // ============================================
  private sanitizeUser(user: UserDocument) {
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.refreshToken;
    delete userObject.emailVerificationToken;
    delete userObject.passwordResetToken;
    delete userObject.passwordResetExpires;
    return userObject;
  }

  // ============================================
  // VALIDATE USER BY ID (For JWT Strategy)
  // ============================================
  async validateUserById(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return this.sanitizeUser(user);
  }
}