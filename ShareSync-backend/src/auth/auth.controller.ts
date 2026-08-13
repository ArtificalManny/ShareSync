// src/auth/auth.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// AUTH CONTROLLER — Complete authentication endpoints
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import { GoogleDeleteGuard } from './guards/google-delete.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/login
  // Standard email/password login
  // Returns needsVerification: true if user exists but not verified
  // ═══════════════════════════════════════════════════════════════════════════
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    console.log('🔵 CONTROLLER: LOGIN');

    const result: any = await this.authService.login(body.email, body.password);

    // Handle unverified user case
    if (result.needsVerification) {
      return {
        success: false,
        needsVerification: true,
        userId: result.userId,
        message: result.message,
      };
    }

    // Normal login success
    const access_token = result.access_token;
    const user = result.user;

    if (!access_token || !user) {
      console.error('❌ LOGIN RESPONSE MISSING TOKEN OR USER:', result);
      throw new UnauthorizedException('Invalid login response format');
    }

    return { success: true, access_token, user };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/register
  // Creates user with isVerified: false, sends verification code
  // ⚠️ MODIFIED: Now returns { userId } instead of { access_token, user }
  // ═══════════════════════════════════════════════════════════════════════════
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body()
    body: {
      email: string;
      username: string;
      password: string;
      firstName: string;
      lastName: string;
    },
  ) {
    console.log('🔵 CONTROLLER: REGISTER');

    const result = await this.authService.register(body);

    return {
      success: true,
      userId: result.userId,
      message: 'Verification code sent to your email',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/verify-email
  // Verifies OTP code, returns JWT immediately (no re-login required)
  // ═══════════════════════════════════════════════════════════════════════════
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: { userId: string; code: string }) {
    console.log('🔵 CONTROLLER: VERIFY EMAIL');

    const result = await this.authService.verifyEmail(body.userId, body.code);

    return {
      success: true,
      user: result.user,
      token: result.token,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/resend-verification
  // Resends verification code
  // ═══════════════════════════════════════════════════════════════════════════
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() body: { userId: string }) {
    console.log('🔵 CONTROLLER: RESEND VERIFICATION');

    await this.authService.resendVerificationCode(body.userId);

    return {
      success: true,
      message: 'New verification code sent',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/forgot-password
  // Sends password reset email
  // ALWAYS returns success (security: don't reveal if email exists)
  // ═══════════════════════════════════════════════════════════════════════════
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email: string }) {
    console.log('🔵 CONTROLLER: FORGOT PASSWORD');

    await this.authService.forgotPassword(body.email);

    // ALWAYS return success (security)
    return {
      success: true,
      message: 'If an account exists, a reset link has been sent',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /auth/validate-reset-token/:token
  // Validates reset token without consuming it
  // ═══════════════════════════════════════════════════════════════════════════
  @Get('validate-reset-token/:token')
  async validateResetToken(@Param('token') token: string) {
    console.log('🔵 CONTROLLER: VALIDATE RESET TOKEN');

    const result = await this.authService.validateResetToken(token);

    return {
      valid: result.valid,
      email: result.email, // Partially masked
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/reset-password
  // Resets password, invalidates all existing sessions
  // ═══════════════════════════════════════════════════════════════════════════
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    console.log('🔵 CONTROLLER: RESET PASSWORD');

    await this.authService.resetPassword(body.token, body.newPassword);

    return {
      success: true,
      message: 'Password updated successfully',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /auth/check-username
  // Check if username is available
  // ═══════════════════════════════════════════════════════════════════════════
  @Get('check-username')
  async checkUsername(@Query('username') username: string) {
    console.log('🔵 CONTROLLER: CHECK USERNAME');

    const available = await this.authService.isUsernameAvailable(username);

    return { available };
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // GOOGLE OAUTH ROUTES
  //
  // Flow:
  // 1. Frontend redirects to GET /api/auth/google
  // 2. Passport redirects to Google consent screen
  // 3. Google redirects back to GET /api/auth/google/callback
  // 4. We issue JWT and redirect to frontend with token in URL
  // ═══════════════════════════════════════════════════════════════════════════

  // google-account-delete-reauth-v1
  // Determine which confirmation mechanism the current account must use.
  @UseGuards(JwtAuthGuard)
  @Get('account-deletion-method')
  async accountDeletionMethod(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;

    const user = await this.userModel
      .findById(userId)
      .select('googleId')
      .lean()
      .exec();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      method: String((user as any).googleId || '').trim()
        ? 'google'
        : 'password',
    };
  }

  // Create a short-lived, signed deletion-purpose OAuth state.
  @UseGuards(JwtAuthGuard)
  @Post('google/delete-intent')
  async googleDeleteIntent(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.userId || req?.user?.id;

    const user = await this.userModel
      .findById(userId)
      .select('googleId')
      .lean()
      .exec();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!String((user as any).googleId || '').trim()) {
      throw new BadRequestException(
        'This account requires current-password confirmation instead.',
      );
    }

    const state = await this.jwtService.signAsync(
      {
        sub: String(userId),
        purpose: 'account-delete-google',
      },
      {
        secret: process.env.JWT_SECRET || 'dev_secret_change_me',
        expiresIn: '5m',
      },
    );

    const rawBackendUrl =
      process.env.PUBLIC_BACKEND_URL ||
      process.env.API_PUBLIC_URL ||
      process.env.BACKEND_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      'http://localhost:5050';

    const backendRoot = String(rawBackendUrl)
      .replace(/\/api\/?$/, '')
      .replace(/\/$/, '');

    return {
      method: 'google',
      authorizationUrl:
        `${backendRoot}/api/auth/google/delete?state=${encodeURIComponent(state)}`,
    };
  }

  // Starts the read-only Google identity-confirmation flow.
  @Get('google/delete')
  @UseGuards(GoogleDeleteGuard)
  async googleDeleteAuth() {
    // Passport redirects to Google.
  }

  // Google returns here. Successful identity confirmation deletes the account
  // server-side; no destructive capability token is exposed to the browser.
  @Get('google/delete/callback')
  @UseGuards(GoogleDeleteGuard)
  async googleDeleteCallback(@Req() req: any, @Res() res: any) {
    const frontendUrl = String(
      process.env.FRONTEND_URL || 'http://localhost:54693',
    ).replace(/\/$/, '');

    const returnToSettings = (reason: string) =>
      res.redirect(
        `${frontendUrl}/settings?section=account&googleDeleteError=${encodeURIComponent(reason)}`,
      );

    if (req?.googleDeleteOAuthError) {
      return returnToSettings(
        req.googleDeleteOAuthError === 'access_denied'
          ? 'cancelled'
          : 'google_confirmation_failed',
      );
    }

    const state = String(req?.query?.state || '').trim();

    let statePayload: any;
    try {
      statePayload = await this.jwtService.verifyAsync(state, {
        secret: process.env.JWT_SECRET || 'dev_secret_change_me',
      });
    } catch {
      return returnToSettings('expired_or_invalid_confirmation');
    }

    if (
      statePayload?.purpose !== 'account-delete-google' ||
      !statePayload?.sub
    ) {
      return returnToSettings('expired_or_invalid_confirmation');
    }

    const userId = String(statePayload.sub);
    const confirmedGoogleId = String(req?.user?.googleId || '').trim();

    if (!confirmedGoogleId) {
      return returnToSettings('google_confirmation_failed');
    }

    const account = await this.userModel
      .findById(userId)
      .select('googleId')
      .lean()
      .exec();

    if (!account) {
      return returnToSettings('account_not_found');
    }

    const storedGoogleId = String((account as any).googleId || '').trim();

    if (!storedGoogleId || storedGoogleId !== confirmedGoogleId) {
      return returnToSettings('wrong_google_account');
    }

    try {
      await this.userService.deleteAccountWithGoogleIdentity(
        userId,
        confirmedGoogleId,
      );
    } catch (error: any) {
      console.error(
        '❌ GOOGLE DELETE CALLBACK: Account deletion failed:',
        error?.message || error,
      );
      return returnToSettings('account_deletion_failed');
    }

    return res.redirect(`${frontendUrl}/login?accountDeleted=1`);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport handles the redirect to Google — this method body is never reached
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res) {
    console.log('🔵 CONTROLLER: GOOGLE CALLBACK');

    try {
      const user = req.user;

      if (!user) {
        console.error('❌ GOOGLE CALLBACK: No user in request');
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:54693'}/auth/google/callback?error=Authentication+failed`,
        );
      }

      // Generate JWT using the same pattern as normal login
      const payload = {
        sub: String(user._id),
        email: user.email,
        tokenVersion: user.tokenVersion || 0,
        ...(user.roles && { roles: user.roles }),
        ...(user.firstName && { firstName: user.firstName }),
        ...(user.lastName && { lastName: user.lastName }),
        ...(user.username && { username: user.username }),
      };

      const token = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'dev_secret_change_me',
        expiresIn: '7d',
      });

      // Build safe user object for frontend
      const safeUser = {
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
      };

      const userParam = encodeURIComponent(JSON.stringify(safeUser));
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:54693';

      console.log('🟢 GOOGLE CALLBACK: Redirecting to frontend with token');

      return res.redirect(
        `${frontendUrl}/auth/google/callback?token=${token}&user=${userParam}`,
      );
    } catch (err) {
      console.error('❌ GOOGLE CALLBACK ERROR:', err.message);
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:54693'}/auth/google/callback?error=${encodeURIComponent(err.message)}`,
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXISTING ENDPOINTS — PRESERVED
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('verify')
  verify(@Body() body: { token: string }) {
    try {
      const decoded = this.jwtService.verify(body.token, {
        secret: process.env.JWT_SECRET || 'dev_secret_change_me',
      });
      return { valid: true, user: decoded };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req) {
    const userId = req?.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not found');
    }

    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
