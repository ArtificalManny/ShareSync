import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; firstName: string; lastName: string; password: string }) {
    try {
      const { email, firstName, lastName, password } = body;
      if (!email || !firstName || !lastName || !password) {
        throw new HttpException('All fields are required', HttpStatus.BAD_REQUEST);
      }

      const existingUser = await this.authService.findByEmail(email);
      if (existingUser) {
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.authService.createUser({ email, firstName, lastName, password: hashedPassword });
      const access_token = await this.authService.generateToken(user);
      return { user, access_token };
    } catch (error) {
      throw new HttpException(error.message || 'Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    try {
      const { email, password } = body;
      if (!email || !password) {
        throw new HttpException('Email and password are required', HttpStatus.BAD_REQUEST);
      }

      const user = await this.authService.validateUser(email, password);
      if (!user) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      const access_token = await this.authService.generateToken(user);
      return { user, access_token };
    } catch (error) {
      throw new HttpException(error.message || 'Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
@Post('forgot-password')
async forgotPassword(@Body() body: { email: string }) {
  try {
    const { email } = body;
    if (!email) {
      throw new HttpException('Email is required', HttpStatus.BAD_REQUEST);
    }

    const user = await this.authService.findByEmail(email);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const token = await this.authService.generateResetToken(user);
    const resetLink = `http://localhost:54693/reset-password/${token}`;
    console.log(`Reset link for ${email}: ${resetLink}`);
    return { message: 'Password reset email sent' };
  } catch (error) {
    throw new HttpException(error.message || 'Failed to send reset email', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

@Post('reset-password')
async resetPassword(@Body() body: { token: string; newPassword: string }) {
  try {
    const { token, newPassword } = body;
    if (!token || !newPassword) {
      throw new HttpException('Token and new password are required', HttpStatus.BAD_REQUEST);
    }

    const user = await this.authService.resetPassword(token, newPassword);
    return { message: 'Password reset successful' };
  } catch (error) {
    throw new HttpException(error.message || 'Failed to reset password', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}