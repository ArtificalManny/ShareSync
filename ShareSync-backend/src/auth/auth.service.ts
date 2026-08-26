// src/auth/auth.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// AUTH SERVICE — Complete authentication logic
// ⚠️ EMAIL SENDING IS STUBBED — Codes are logged to console for testing
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';

import { User, UserDocument } from '../user/schemas/user.schema';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './refresh-token.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    private readonly jwt: JwtService,
    private readonly mailer: MailerService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // EXISTING METHODS — PRESERVED
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * ✅ Used by JwtStrategy to load the user from JWT payload.sub
   * Returns a "safe" user object (no password), or null if not found.
   */
  public async validateUserById(userId: string) {
    if (!userId) return null;

    const user = await this.userModel
      .findById(userId)
      .select('-password')
      .lean();

    if (!user) return null;

    this.enforceAccountAllowed(user);

    return user;
  }

  /** Validate email/password and return the user (without password) */
  public async validateUser(email: string, password: string) {
    console.log('🔵 VALIDATE USER CALLED');
    console.log('🔵 email type:', typeof email, 'value:', email);
    console.log('🔵 password type:', typeof password, 'length:', password?.length);

    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password')
      .lean<UserDocument & { password?: string }>();

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const stored = user.password || '';
    let ok = false;

    // If hashed with bcrypt, compare; else plain compare (dev-only).
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

    this.enforceAccountAllowed(user);

    const { password: _pw, ...safe } = user as any;
    return safe;
  }

  /** Issue JWT and return it along with the safe user object */
  public async login(email: string, password: string) {
    console.log('🔵 LOGIN SERVICE CALLED');
    console.log('🔵 email type:', typeof email, 'value:', email);
    console.log('🔵 password type:', typeof password, 'length:', password?.length);

    const user = await this.validateUser(email, password);

    // ⭐ Check if user is verified (using isEmailVerified - existing field)
    if (user.isEmailVerified === false) {
      // User exists but not verified - resend code and return special response
      void this.resendVerificationCode(String(user._id)).catch((error: any) => {
        console.error('❌ Auto resend verification failed during login:', {
          message: error?.message,
          code: error?.code,
          command: error?.command,
          response: error?.response,
          responseCode: error?.responseCode,
        });
      });
      return {
        success: false,
        needsVerification: true,
        userId: String(user._id),
        message: 'Please verify your email',
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

    // openshare-persistent-session-v1
    const refresh_token = await this.createRefreshSession(String(user._id));

    // ═════════════════════════════════════════════════════════════════════════
    // ⭐ PHASE 1 FIX: Expanded user object in login response
    //    Previously only returned: _id, email, firstName, lastName, username, roles
    //    Now also includes: displayName, profilePicture, xp, level, streakDays,
    //    longestStreak, totalShips, bio, achievements, badges
    //    This ensures AuthContext stores a richer user object from the start.
    // ═════════════════════════════════════════════════════════════════════════
    return {
      success: true,
      access_token,
      refresh_token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        displayName: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '',
        profilePicture: user.profilePicture || null,
        xp: user.xp || 0,
        level: user.level || 1,
        streakDays: user.streakDays || 0,
        longestStreak: user.longestStreak || 0,
        totalShips: user.totalShips || 0,
        totalTasksCompleted: user.totalTasksCompleted || 0,
        bio: user.bio || '',
        achievements: user.achievements || [],
        badges: user.badges || [],
        roles: user.roles || [],
        accountStatus: user.accountStatus || 'active',
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW METHODS — REGISTER WITH EMAIL VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Register a new user with email verification
   * ⚠️ Does NOT send actual email — logs code to console for testing
   */
  public async register(dto: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<{ userId: string }> {
    console.log('🔵 REGISTER SERVICE CALLED');
    console.log('🔵 email:', dto.email, 'username:', dto.username);

    // Check if email/username already exists
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

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Generate 6-digit verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const hashedCode = await bcrypt.hash(verificationCode, 10);
    const codeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create user (NOT verified yet)
    // ═════════════════════════════════════════════════════════════════════════
    // ⭐ PHASE 1 FIX: Now also sets displayName at registration time
    //    so the Profile page can show the user's real name immediately.
    // ═════════════════════════════════════════════════════════════════════════
    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      username: dto.username.toLowerCase(),
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      displayName: `${dto.firstName} ${dto.lastName}`.trim(),
      isEmailVerified: false,  // ⭐ Using existing field name
      verificationCode: hashedCode,
      verificationCodeExpiry: codeExpiry,
      tokenVersion: 0,
    });
    try {
      await this.sendVerificationEmail(dto.email.toLowerCase(), verificationCode, codeExpiry);
    } catch (error) {
      // Avoid trapping a new user in "email already registered" if production email fails.
      await this.userModel.findByIdAndDelete(user._id).catch(() => undefined);
      console.error('❌ Failed to send verification email:', (error as Error)?.message || error);
      throw new BadRequestException('Could not send verification email. Please try again later.');
    }

    return { userId: String(user._id) };

  }

  /**
   * Verify email with OTP code
   * Returns JWT token immediately (no re-login required)
   */
  public async verifyEmail(
    userId: string,
    code: string,
  ): Promise<{ user: any; token: string }> {
    console.log('🔵 VERIFY EMAIL CALLED');
    console.log('🔵 userId:', userId, 'code:', code);

    const user = await this.userModel
      .findById(userId)
      .select('+verificationCode');

    if (!user) {
      throw new BadRequestException('Invalid user');
    }

    this.enforceAccountAllowed(user);

    if (user.isEmailVerified) {  // ⭐ Using existing field name
      throw new BadRequestException('Email already verified');
    }

    if (!user.verificationCode || new Date() > user.verificationCodeExpiry) {
      throw new BadRequestException('Verification code expired');
    }

    const isValid = await bcrypt.compare(code, user.verificationCode);
    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Update user as verified
    user.isEmailVerified = true;  // ⭐ Using existing field name
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    // Generate JWT
    const token = await this.generateToken(user);

    console.log('🟢 EMAIL VERIFIED - Token generated');

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Resend verification code
   */
  public async resendVerificationCode(userId: string): Promise<void> {
    console.log('🔵 RESEND VERIFICATION CODE CALLED');

    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {  // ⭐ Using existing field name
      throw new BadRequestException('Email already verified');
    }

    // Generate new 6-digit code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const hashedCode = await bcrypt.hash(verificationCode, 10);
    const codeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.verificationCode = hashedCode;
    user.verificationCodeExpiry = codeExpiry;
    await user.save();
    try {
      await this.sendVerificationEmail(user.email, verificationCode, codeExpiry);
    } catch (error: any) {
      console.error('❌ Could not send verification email on resend:', {
        message: error?.message,
        code: error?.code,
        command: error?.command,
        response: error?.response,
        responseCode: error?.responseCode,
      });

      // IMPORTANT:
      // Do not let SMTP failure turn login into a 500.
      // The account remains unverified, and the frontend should still redirect
      // the user to /verify-email.
    }

  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW METHODS — FORGOT/RESET PASSWORD
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Request password reset
   * ⚠️ Does NOT send actual email — logs reset URL to console for testing
   * Always returns success (security: don't reveal if email exists)
   */
  public async forgotPassword(email: string): Promise<void> {
    console.log('🔵 FORGOT PASSWORD CALLED');
    console.log('🔵 email:', email);

    const user = await this.userModel.findOne({ email: email.toLowerCase() });

    // Silently return if user doesn't exist (security)
    if (!user) {
      console.log('🟡 User not found, returning silently for security');
      return;
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save to user - ⭐ Using EXISTING field names
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = tokenExpiry;
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    try {
      await this.sendPasswordResetEmail(user.email, resetUrl, tokenExpiry);
    } catch (error) {
      // Keep forgot-password response silent for account-enumeration safety.
      console.error('❌ Failed to send password reset email:', (error as Error)?.message || error);
    }

  }

  /**
   * Validate reset token without consuming it
   */
  public async validateResetToken(
    token: string,
  ): Promise<{ valid: boolean; email?: string }> {
    console.log('🔵 VALIDATE RESET TOKEN CALLED');

    // ⭐ Using EXISTING field name: passwordResetExpires
    const users = await this.userModel
      .find({
        passwordResetExpires: { $gt: new Date() },
      })
      .select('+passwordResetToken');

    for (const user of users) {
      if (user.passwordResetToken) {
        const isValid = await bcrypt.compare(token, user.passwordResetToken);
        if (isValid) {
          // Mask email for privacy
          const maskedEmail = this.maskEmail(user.email);
          return { valid: true, email: maskedEmail };
        }
      }
    }

    return { valid: false };
  }

  /**
   * Reset password with token
   * Invalidates all existing sessions
   */
  public async resetPassword(token: string, newPassword: string): Promise<void> {
    console.log('🔵 RESET PASSWORD CALLED');

    // ⭐ Using EXISTING field name: passwordResetExpires
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

    if (!targetUser) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user - ⭐ Using EXISTING field names
    targetUser.password = hashedPassword;
    targetUser.passwordResetToken = undefined;
    targetUser.passwordResetExpires = undefined;

    // IMPORTANT: Invalidate all existing tokens/sessions
    targetUser.tokenVersion = (targetUser.tokenVersion || 0) + 1;

    await targetUser.save();

    await this.revokeAllRefreshSessions(String(targetUser._id));

    console.log('🟢 PASSWORD RESET SUCCESSFUL for', targetUser.email);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW METHODS — USERNAME CHECK
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if username is available
   */
  public async isUsernameAvailable(username: string): Promise<boolean> {
    const existing = await this.userModel.findOne({
      username: username.toLowerCase(),
    });
    return !existing;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GOOGLE OAUTH — Find or create user from Google profile
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Called by GoogleStrategy.validate() after Google confirms the user's identity.
   *
   * Logic:
   * 1. If a user with this googleId exists → return them (returning user)
   * 2. If a user with this email exists but no googleId → LINK the Google account
   * 3. If no user exists → CREATE a new one (auto-verified, random password)
   */
  public async validateOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
  }) {
    console.log('🔵 GOOGLE AUTH: validateOrCreateGoogleUser for', profile.email);

    // 1. Check if user already linked via googleId
    let user = await this.userModel.findOne({ googleId: profile.googleId }).lean();

    if (user) {
      this.enforceAccountAllowed(user);
      console.log('🟢 GOOGLE AUTH: Existing Google-linked user found:', user.email);
      const { password: _pw, ...safe } = user as any;
      return safe;
    }

    // 2. Check if user with same email exists (link Google account)
    user = await this.userModel
      .findOne({ email: profile.email.toLowerCase() })
      .lean();

    if (user) {
      this.enforceAccountAllowed(user);
      console.log('🟡 GOOGLE AUTH: Existing email user found, linking Google account');
      await this.userModel.findByIdAndUpdate(user._id, {
        googleId: profile.googleId,
        // Only update profile picture if user doesn't have one
        ...(!user.profilePicture && profile.profilePicture
          ? { profilePicture: profile.profilePicture }
          : {}),
        // Mark email as verified since Google confirmed it
        isEmailVerified: true,
      });

      const updated = await this.userModel
        .findById(user._id)
        .select('-password')
        .lean();
      return updated;
    }

    // 3. Create brand new user from Google profile
    console.log('🟢 GOOGLE AUTH: Creating new user from Google profile');

    // Generate a random password hash (user can't use it — they sign in via Google)
    const randomPassword = await bcrypt.hash(
      crypto.randomBytes(32).toString('hex'),
      12,
    );

    // Generate a unique username from email prefix
    const emailPrefix = profile.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
    let username = emailPrefix;
    let attempt = 0;
    while (await this.userModel.findOne({ username })) {
      attempt++;
      username = `${emailPrefix}${attempt}`;
    }

    const newUser = await this.userModel.create({
      email: profile.email.toLowerCase(),
      username,
      password: randomPassword,
      firstName: profile.firstName,
      lastName: profile.lastName,
      displayName: `${profile.firstName} ${profile.lastName}`.trim(),
      profilePicture: profile.profilePicture || undefined,
      googleId: profile.googleId,
      isEmailVerified: true, // Google already verified the email
      tokenVersion: 0,
    });

    console.log('🟢 GOOGLE AUTH: New user created:', newUser.email, '(username:', username, ')');

    const obj = newUser.toObject();
    delete obj.password;
    return obj;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private enforceAccountAllowed(user: any): void {
    const status = String(user?.accountStatus || 'active').toLowerCase();

    if (!['suspended', 'disabled', 'banned'].includes(status)) {
      return;
    }

    if (status === 'suspended') {
      const until = user?.suspendedUntil ? new Date(user.suspendedUntil) : null;
      const hasValidUntil =
        until instanceof Date && Number.isFinite(until.getTime());

      if (hasValidUntil && until.getTime() <= Date.now()) {
        return;
      }

      throw new ForbiddenException(
        hasValidUntil
          ? `Account suspended until ${until.toISOString()}`
          : 'Account suspended',
      );
    }

    if (status === 'disabled') {
      throw new ForbiddenException('Account disabled');
    }

    throw new ForbiddenException('Account banned');
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // PERSISTENT REFRESH SESSIONS
  // openshare-persistent-session-v1
  // ═══════════════════════════════════════════════════════════════════════════

  private refreshSessionDays(): number {
    const value = Number.parseInt(
      process.env.AUTH_REFRESH_SESSION_DAYS || '365',
      10,
    );

    return Number.isFinite(value) && value > 0 ? value : 365;
  }

  private refreshSessionExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + this.refreshSessionDays(),
    );
    return expiresAt;
  }

  private hashRefreshToken(token: string): string {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  private generateRefreshTokenValue(): string {
    return crypto.randomBytes(48).toString('base64url');
  }

  public async createRefreshSession(
    userId: string,
  ): Promise<string> {
    const rawToken = this.generateRefreshTokenValue();

    await this.refreshTokenModel.create({
      userId: String(userId),
      tokenHash: this.hashRefreshToken(rawToken),
      expiresAt: this.refreshSessionExpiry(),
    });

    return rawToken;
  }

  public async rotateRefreshSession(
    refreshToken: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: Partial<User>;
  }> {
    const rawToken =
      String(refreshToken || '').trim();

    if (!rawToken) {
      throw new UnauthorizedException(
        'Missing refresh token',
      );
    }

    const now = new Date();

    const session =
      await this.refreshTokenModel
        .findOne({
          tokenHash:
            this.hashRefreshToken(rawToken),
          revokedAt: { $exists: false },
          expiresAt: { $gt: now },
        })
        .exec();

    if (!session) {
      throw new UnauthorizedException(
        'Session expired or revoked',
      );
    }

    const user = await this.userModel
      .findById(session.userId)
      .select('-password')
      .exec();

    if (!user) {
      throw new UnauthorizedException(
        'User not found',
      );
    }

    this.enforceAccountAllowed(user);

    // openshare-persistent-session-rolling-v2
    // Keep one opaque session token per login/device.
    // Every successful use renews the inactivity window.
    session.lastUsedAt = now;
    session.expiresAt =
      this.refreshSessionExpiry();

    await session.save();

    const access_token =
      await this.generateToken(
        user,
        '7d',
      );

    return {
      access_token,
      refresh_token: rawToken,
      user: this.sanitizeUser(user),
    };
  }

  public async revokeRefreshSession(
    refreshToken: string,
  ): Promise<void> {
    const rawToken = String(refreshToken || '').trim();

    if (!rawToken) {
      return;
    }

    await this.refreshTokenModel.updateOne(
      {
        tokenHash: this.hashRefreshToken(rawToken),
        revokedAt: { $exists: false },
      },
      {
        $set: {
          revokedAt: new Date(),
        },
      },
    );
  }

  public async revokeAllRefreshSessions(
    userId: string,
  ): Promise<void> {
    await this.refreshTokenModel.updateMany(
      {
        userId: String(userId),
        revokedAt: { $exists: false },
      },
      {
        $set: {
          revokedAt: new Date(),
        },
      },
    );
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

  private isSmtpConfigured(): boolean {
    return Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
    );
  }

  private getMailFrom(): string {
    return (
      process.env.MAIL_FROM ||
      process.env.EMAIL_FROM ||
      (process.env.SMTP_USER ? `"OpenShare" <${process.env.SMTP_USER}>` : 'OpenShare <no-reply@openshare.ca>')
    );
  }

  private async sendVerificationEmail(
    to: string,
    code: string,
    expiresAt: Date,
  ): Promise<void> {
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5;color:#0f172a">
          <div style="text-align:center;margin:0 0 28px;">
            <img
              src="https://openshare.ca/brand/openshare-email-lockup.png"
              width="240"
              alt="OpenShare"
              style="display:block;width:240px;max-width:100%;height:auto;margin:0 auto;border:0;"
            />
          </div>
        <h2>Your OpenShare verification code</h2>
        <p>Use this 6-digit code to verify your email:</p>
        <div style="font-size:32px;font-weight:800;letter-spacing:8px;margin:24px 0;color:#7c3aed">
          ${code}
        </div>
        <p>This code expires at ${expiresAt.toISOString()}.</p>
        <p style="color:#64748b;font-size:13px">If you did not create an OpenShare account, you can ignore this email.</p>
      </div>
    `;

    const text = `Your OpenShare verification code is ${code}. It expires at ${expiresAt.toISOString()}.`;

    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM;

    if (resendApiKey && resendFrom) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: resendFrom,
            to,
            subject: 'Your OpenShare verification code',
            html,
            text,
          }),
        });

        const body = await response.text();

        if (!response.ok) {
          throw new Error(`Resend API failed with ${response.status}: ${body}`);
        }

        console.log('🟢 Verification email sent via Resend to', to);
        return;
      } catch (error: any) {
        console.error('❌ Resend verification email failed:', {
          message: error?.message,
          code: error?.code,
          response: error?.response,
          responseCode: error?.responseCode,
        });

        throw error;
      }
    }

    if (!this.isSmtpConfigured()) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Email is not configured: missing RESEND_API_KEY/RESEND_FROM or SMTP settings');
      }

      console.log('═══════════════════════════════════════════════════════════');
      console.log('📧 DEV VERIFICATION CODE FOR', to);
      console.log('📧 CODE:', code);
      console.log('📧 EXPIRES:', expiresAt.toISOString());
      console.log('═══════════════════════════════════════════════════════════');
      return;
    }

    try {
      await this.mailer.sendMail({
        from: this.getMailFrom(),
        to,
        subject: 'Your OpenShare verification code',
        html,
        text,
      });

      console.log('🟢 Verification email sent via SMTP to', to);
    } catch (error: any) {
      console.error('❌ SMTP verification email failed:', {
        message: error?.message,
        code: error?.code,
        command: error?.command,
        response: error?.response,
        responseCode: error?.responseCode,
      });

      throw error;
    }
  }

  private async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
    expiresAt: Date,
  ): Promise<void> {
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5;color:#0f172a">
        <div style="text-align:center;margin:0 0 28px;">
          <img
            src="https://openshare.ca/brand/openshare-email-lockup.png"
            width="240"
            alt="OpenShare"
            style="display:block;width:240px;max-width:100%;height:auto;margin:0 auto;border:0;"
          />
        </div>
        <h2>Reset your OpenShare password</h2>
        <p>Click the button below to reset your password:</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">
            Reset password
          </a>
        </p>
        <p>This link expires at ${expiresAt.toISOString()}.</p>
        <p style="color:#64748b;font-size:13px">If you did not request a password reset, you can ignore this email.</p>
      </div>
    `;

    const text =
      `Reset your OpenShare password here: ${resetUrl}. ` +
      `This link expires at ${expiresAt.toISOString()}.`;

    // auth-password-reset-resend-v1
    // Production auth email should use the same Resend transport
    // as verification and the rest of OpenShare.
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM;

    if (resendApiKey && resendFrom) {
      try {
        const response = await fetch(
          'https://api.resend.com/emails',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: resendFrom,
              to,
              subject: 'Reset your OpenShare password',
              html,
              text,
            }),
          },
        );

        const body = await response.text();

        if (!response.ok) {
          throw new Error(
            `Resend API failed with ${response.status}: ${body}`,
          );
        }

        console.log(
          '🟢 Password reset email sent via Resend to',
          to,
        );
        return;
      } catch (error: any) {
        console.error(
          '❌ Resend password reset email failed:',
          {
            message: error?.message,
            code: error?.code,
            response: error?.response,
            responseCode: error?.responseCode,
          },
        );

        throw error;
      }
    }

    if (!this.isSmtpConfigured()) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'Email is not configured: missing RESEND_API_KEY/RESEND_FROM or SMTP settings',
        );
      }

      console.log(
        '═══════════════════════════════════════════════════════════',
      );
      console.log('🔑 DEV PASSWORD RESET FOR', to);
      console.log('🔑 RESET URL:', resetUrl);
      console.log('🔑 EXPIRES:', expiresAt.toISOString());
      console.log(
        '═══════════════════════════════════════════════════════════',
      );
      return;
    }

    await this.mailer.sendMail({
      from: this.getMailFrom(),
      to,
      subject: 'Reset your OpenShare password',
      html,
      text,
    });

    console.log(
      '🟢 Password reset email sent via SMTP to',
      to,
    );
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
