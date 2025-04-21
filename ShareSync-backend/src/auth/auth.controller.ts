import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt'; // Added import

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; firstName: string; lastName: string; password: string }) {
    console.log('Received register request:', body);
    try {
      const { email, firstName, lastName, password } = body;
      if (!email || !firstName || !lastName || !password) {
        console.log('Missing required fields');
        throw new HttpException('All fields are required', HttpStatus.BAD_REQUEST);
      }

      const existingUser = await this.authService.findByEmail(email);
      if (existingUser) {
        console.log('User already exists:', email);
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('Hashed password:', hashedPassword);
      const user = await this.authService.createUser({ email, firstName, lastName, password: hashedPassword });
      const access_token = await this.authService.generateToken(user);
      console.log('Registration successful for email:', email);
      return { user, access_token };
    } catch (error) {
      console.error('Registration error:', error.message);
      throw new HttpException(error.message || 'Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    console.log('Received login request:', body);
    try {
      const { email, password } = body;
      if (!email || !password) {
        console.log('Missing email or password');
        throw new HttpException('Email and password are required', HttpStatus.BAD_REQUEST);
      }

      const user = await this.authService.validateUser(email, password);
      if (!user) {
        console.log('Invalid credentials for email:', email);
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      const access_token = await this.authService.generateToken(user);
      console.log('Login successful for email:', email);
      return { user, access_token };
    } catch (error) {
      console.error('Login error:', error.message);
      throw new HttpException(error.message || 'Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    console.log('Received forgot-password request:', body);
    try {
      const { email } = body;
      if (!email) {
        console.log('Missing email');
        throw new HttpException('Email is required', HttpStatus.BAD_REQUEST);
      }

      const user = await this.authService.findByEmail(email);
      if (!user) {
        console.log('User not found:', email);
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const token = await this.authService.createResetToken(user); // Fixed method name
      const resetLink = `http://localhost:54693/reset-password/${token}`;
      console.log(`Reset link for ${email}: ${resetLink}`);
      return { message: 'Password reset email sent' };
    } catch (error) {
      console.error('Forgot password error:', error.message);
      throw new HttpException(error.message || 'Failed to send reset email', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    console.log('Received reset-password request:', body);
    try {
      const { token, newPassword } = body;
      if (!token || !newPassword) {
        console.log('Missing token or new password');
        throw new HttpException('Token and new password are required', HttpStatus.BAD_REQUEST);
      }

      const user = await this.authService.updatePasswordWithToken(token, newPassword); // Fixed method name
      console.log('Password reset successful for user:', user.email);
      return { message: 'Password reset successful' };
    } catch (error) {
      console.error('Reset password error:', error.message);
      throw new HttpException(error.message || 'Failed to reset password', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}