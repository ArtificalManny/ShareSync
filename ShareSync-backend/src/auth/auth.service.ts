// src/auth/auth.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// AUTH SERVICE — Complete authentication logic
// ⭐ LIVE EMAIL ENABLED via Resend SDK
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Resend } from 'resend';

import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class AuthService {
  private resend: Resend;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwt: JwtService,
  ) {
    // Initialize Resend with your API key from .env
    this.resend = new Resend(process.env.RESEND_API_KEY || 'placeholder_key');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXISTING METHODS — PRESERVED
  // ═══════════════════════════════════════════════════════════════════════════

  public async validateUserById(userId: string) {
    if (!userId) return null;

    const user = await this.userModel
      .findById(userId)
      .select('-password')
      .lean();

    if (!user) return null;

    return user;
  }

  public async validateUser(email: string, password: string) {
    console.log('🔵 VALIDATE USER CALLED');

    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password')
      .lean<UserDocument & { password?: string }>();

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const stored = user.password || '';
    let ok = false;

    if (
      stored.startsWith('$2a$') ||
      stored.startsWith('$2b$') ||
      stored.startsWith('$2y$')
    ) {
      ok = await bcrypt.compare(password, stored);
    } else {
      ok = stored === password;
    }

    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const { password: _pw, ...safe } = user as any;
    return safe;
  }

  public async login(email: string, password: string) {
    console.log('🔵 LOGIN SERVICE CALLED');

    const user = await this.validateUser(email, password);

    if (user.isEmailVerified === false) {
      await this.resendVerificationCode(String(user._id));
      return {
        success: false,
        needsVerification: true,
        userId: String(user._id),
        message: 'Please verify your email. A new code has been sent.',
      };
    }

    const payload = {
      sub: String(user._id),
      email: user.email,
      tokenVersion: user.tokenVersion || 0,
      ...(user.roles && { roles: user.roles }),
      ...(user.firstName && { firstName: user.firstName }),
      ...(user.lastName && { lastName: user.lastName }),
      ...(user.username && { username: user.username }),
    };

    const access_token = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'dev_secret_change_me',
      expiresIn: '7d',
    });

    console.log('🟢 LOGIN SUCCESS - Token generated');

    return {
      success: true,
      access_token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        roles: user.roles || [],
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTER WITH LIVE EMAIL VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  public async register(dto: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<{ userId: string }> {
    console.log('🔵 REGISTER SERVICE CALLED');

    const existing = await this.userModel.findOne({
      $or: [
        { email: dto.email.toLowerCase() },
        { username: dto.username.toLowerCase() },
      ],
    });

    if (existing) {
      if (existing.email === dto.email.toLowerCase()) {
        throw new BadRequestException('Email already registered');
      }
      throw new BadRequestException('Username already taken');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const hashedCode = await bcrypt.hash(verificationCode, 10);
    const codeExpiry = new Date(Date.now() + 15 * 60 * 1000);

    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      username: dto.username.toLowerCase(),
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      isEmailVerified: false,
      verificationCode: hashedCode,
      verificationCodeExpiry: codeExpiry,
      tokenVersion: 0,
    });

    // ⭐ LIVE EMAIL DISPATCH
    try {
      if (process.env.RESEND_API_KEY) {
        await this.resend.emails.send({
          from: process.env.EMAIL_FROM || 'OpenShare <onboarding@resend.dev>',
          to: dto.email.toLowerCase(),
          subject: 'Your OpenShare Verification Code',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to OpenShare, ${dto.firstName}!</h2>
              <p>Here is your 6-digit verification code to activate your account:</p>
              <h1 style="font-size: 32px; letter-spacing: 5px; color: #8B5CF6;">${verificationCode}</h1>
              <p>This code will expire in 15 minutes.</p>
              <p>If you did not request this, please ignore this email.</p>
            </div>
          `,
        });
        console.log(`🟢 Verification email sent to ${dto.email}`);
      } else {
        console.log('⚠️ RESEND_API_KEY missing. Fallback STUB mode. Code:', verificationCode);
      }
    } catch (error) {
      console.error('🔴 Failed to send verification email:', error);
    }

    return { userId: String(user._id) };
  }

  public async verifyEmail(
    userId: string,
    code: string,
  ): Promise<{ user: any; token: string }> {
    console.log('🔵 VERIFY EMAIL CALLED');

    const user = await this.userModel
      .findById(userId)
      .select('+verificationCode');

    if (!user) throw new BadRequestException('Invalid user');
    if (user.isEmailVerified) throw new BadRequestException('Email already verified');

    if (!user.verificationCode || new Date() > user.verificationCodeExpiry) {
      throw new BadRequestException('Verification code expired');
    }

    const isValid = await bcrypt.compare(code, user.verificationCode);
    if (!isValid) throw new BadRequestException('Invalid verification code');

    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    const token = await this.generateToken(user);
    console.log('🟢 EMAIL VERIFIED - Token generated');

    return { user: this.sanitizeUser(user), token };
  }

  public async resendVerificationCode(userId: string): Promise<void> {
    console.log('🔵 RESEND VERIFICATION CODE CALLED');

    const user = await this.userModel.findById(userId);

    if (!user) throw new BadRequestException('User not found');
    if (user.isEmailVerified) throw new BadRequestException('Email already verified');

    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const hashedCode = await bcrypt.hash(verificationCode, 10);
    const codeExpiry = new Date(Date.now() + 15 * 60 * 1000);

    user.verificationCode = hashedCode;
    user.verificationCodeExpiry = codeExpiry;
    await user.save();

    // ⭐ LIVE EMAIL DISPATCH
    try {
      if (process.env.RESEND_API_KEY) {
        await this.resend.emails.send({
          from: process.env.EMAIL_FROM || 'OpenShare <onboarding@resend.dev>',
          to: user.email,
          subject: 'Your new OpenShare Verification Code',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <p>Here is your new 6-digit verification code:</p>
              <h1 style="font-size: 32px; letter-spacing: 5px; color: #8B5CF6;">${verificationCode}</h1>
              <p>This code will expire in 15 minutes.</p>
            </div>
          `,
        });
        console.log(`🟢 New verification email sent to ${user.email}`);
      } else {
        console.log('⚠️ RESEND_API_KEY missing. Fallback STUB mode. Code:', verificationCode);
      }
    } catch (error) {
      console.error('🔴 Failed to send resend email:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIVE FORGOT/RESET PASSWORD
  // ═══════════════════════════════════════════════════════════════════════════

  public async forgotPassword(email: string): Promise<void> {
    console.log('🔵 FORGOT PASSWORD CALLED');

    const user = await this.userModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('🟡 User not found, returning silently for security');
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = tokenExpiry;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // ⭐ LIVE EMAIL DISPATCH
    try {
      if (process.env.RESEND_API_KEY) {
        await this.resend.emails.send({
          from: process.env.EMAIL_FROM || 'OpenShare <onboarding@resend.dev>',
          to: user.email,
          subject: 'Reset your OpenShare Password',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Password Reset Request</h2>
              <p>We received a request to reset your OpenShare password. Click the button below to choose a new password:</p>
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #8B5CF6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Reset Password</a>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #64748B;">${resetUrl}</p>
              <p>This link expires in 15 minutes.</p>
              <p>If you did not request a password reset, you can safely ignore this email.</p>
            </div>
          `,
        });
        console.log(`🟢 Password reset email sent to ${user.email}`);
      } else {
        console.log('⚠️ RESEND_API_KEY missing. Fallback STUB mode. Reset URL:', resetUrl);
      }
    } catch (error) {
      console.error('🔴 Failed to send password reset email:', error);
    }
  }

  public async validateResetToken(
    token: string,
  ): Promise<{ valid: boolean; email?: string }> {
    console.log('🔵 VALIDATE RESET TOKEN CALLED');

    const users = await this.userModel
      .find({
        passwordResetExpires: { $gt: new Date() },
      })
      .select('+passwordResetToken');

    for (const user of users) {
      if (user.passwordResetToken) {
        const isValid = await bcrypt.compare(token, user.passwordResetToken);
        if (isValid) {
          const maskedEmail = this.maskEmail(user.email);
          return { valid: true, email: maskedEmail };
        }
      }
    }

    return { valid: false };
  }

  public async resetPassword(token: string, newPassword: string): Promise<void> {
    console.log('🔵 RESET PASSWORD CALLED');

    const users = await this.userModel
      .find({
        passwordResetExpires: { $gt: new Date() },
      })
      .select('+passwordResetToken');

    let targetUser: UserDocument | null = null;

    for (const user of users) {
      if (user.passwordResetToken) {
        const isValid = await bcrypt.compare(token, user.passwordResetToken);
        if (isValid) {
          targetUser = user;
          break;
        }
      }
    }

    if (!targetUser) throw new BadRequestException('Invalid or expired reset token');

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    targetUser.password = hashedPassword;
    targetUser.passwordResetToken = undefined;
    targetUser.passwordResetExpires = undefined;
    targetUser.tokenVersion = (targetUser.tokenVersion || 0) + 1;

    await targetUser.save();
    console.log('🟢 PASSWORD RESET SUCCESSFUL for', targetUser.email);
  }

  public async isUsernameAvailable(username: string): Promise<boolean> {
    const existing = await this.userModel.findOne({
      username: username.toLowerCase(),
    });
    return !existing;
  }

  private async generateToken(
    user: UserDocument,
    expiresIn: string = '7d',
  ): Promise<string> {
    const payload = {
      sub: String(user._id),
      email: user.email,
      tokenVersion: user.tokenVersion || 0,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
    };

    return this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'dev_secret_change_me',
      expiresIn,
    });
  }

  private sanitizeUser(user: UserDocument): Partial<User> {
    const obj = user.toObject();
    delete obj.password;
    delete obj.verificationCode;
    delete obj.verificationCodeExpiry;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpires;
    return obj;
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    const masked = local[0] + '***' + local[local.length - 1];
    return `${masked}@${domain}`;
  }
}
