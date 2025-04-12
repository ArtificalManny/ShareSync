import { Controller, Post, Body, HttpException, HttpStatus, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

// From "The Customer Service Revolution": Provide clear feedback for user actions.
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('test')
  async test() {
    return { message: 'Test endpoint reached' };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    console.log('AuthController: Login request received:', JSON.stringify(loginDto, null, 2));
    try {
      const user = await this.authService.login(loginDto);
      console.log('AuthController: Login successful:', JSON.stringify(user, null, 2));
      return {
        status: 'success',
        message: 'Login successful',
        data: user,
      };
    } catch (error) {
      console.error('AuthController: Login error:', error.message);
      throw new HttpException(
        error.message || 'An error occurred during login',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    console.log('AuthController: Register request received:', JSON.stringify(registerDto, null, 2));
    try {
      const user = await this.authService.register(registerDto);
      console.log('AuthController: Register successful:', JSON.stringify(user, null, 2));
      return {
        status: 'success',
        message: 'User registered successfully. Please verify your email.',
        data: user,
      };
    } catch (error) {
      console.error('AuthController: Register error:', error.message);
      throw new HttpException(
        error.message || 'An error occurred during registration',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    console.log('AuthController: Forgot password request received:', JSON.stringify(forgotPasswordDto, null, 2));
    try {
      await this.authService.forgotPassword(forgotPasswordDto.email);
      console.log('AuthController: Forgot password email sent');
      return {
        status: 'success',
        message: 'A reset link has been sent to your email.',
      };
    } catch (error) {
      console.error('AuthController: Forgot password error:', error.message);
      throw new HttpException(
        error.message || 'An error occurred while sending the reset link',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    console.log('AuthController: Reset password request received:', JSON.stringify(resetPasswordDto, null, 2));
    try {
      await this.authService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      );
      console.log('AuthController: Password reset successful');
      return {
        status: 'success',
        message: 'Password reset successful. Please log in with your new password.',
      };
    } catch (error) {
      console.error('AuthController: Reset password error:', error.message);
      throw new HttpException(
        error.message || 'An error occurred while resetting the password',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}