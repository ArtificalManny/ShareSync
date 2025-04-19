import { Controller, Post, Get, Req, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('create-test-user')
  async createTestUser(@Req() req: Request, @Res() res: Response) {
    try {
      const user = await this.authService.createTestUser('eamonrivas@gmail.com', 'S7mR0!%uMZ<$[w%@');
      res.status(201).json({ message: 'Test user created', user });
    } catch (error) {
      console.error('AuthController: Create test user error:', error.message);
      res.status(401).json({ message: error.message });
    }
  }

  @Post('login')
  async login(@Req() req: Request, @Res() res: Response) {
    console.log('AuthController: Login request received:', req.body);
    const { email, password } = req.body;
    console.log('AuthController: Extracted email:', email, 'password:', password);
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }
    try {
      const user = await this.authService.login(email, password);
      console.log('AuthController: Login successful, user:', user);
      res.status(200).json(user);
    } catch (error) {
      console.error('AuthController: Login error:', error.message);
      res.status(401).json({ message: error.message });
    }
  }

  @Post('register')
  async register(@Req() req: Request, @Res() res: Response) {
    console.log('AuthController: Register request received:', req.body);
    try {
      const user = await this.authService.register(req.body);
      console.log('AuthController: Register successful, user:', user);
      res.status(201).json(user);
    } catch (error) {
      console.error('AuthController: Register error:', error.message);
      res.status(400).json({ message: error.message });
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Req() req: Request, @Res() res: Response) {
    console.log('AuthController: Forgot password request received:', req.body);
    const { email } = req.body;
    if (!email) {
      console.log('AuthController: Email is required for forgot password');
      res.status(400).json({ message: 'Email is required' });
      return;
    }
    try {
      const resetLink = await this.authService.forgotPassword(email);
      console.log('AuthController: Reset link generated:', resetLink);
      res.status(200).json({ message: 'Password reset link sent (check console for link)', resetLink });
    } catch (error) {
      console.error('AuthController: Forgot password error:', error.message);
      res.status(401).json({ message: error.message });
    }
  }

  @Post('reset-password/:token')
  async resetPassword(@Req() req: Request, @Res() res: Response) {
    console.log('AuthController: Reset password request received:', req.body);
    const { newPassword, token } = req.body;
    if (!newPassword || !token) {
      console.log('AuthController: New password and token are required for reset password');
      res.status(400).json({ message: 'New password and token are required' });
      return;
    }
    try {
      await this.authService.resetPassword(token, newPassword);
      console.log('AuthController: Password reset successful');
      res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('AuthController: Reset password error:', error.message);
      res.status(401).json({ message: error.message });
    }
  }

  @Get('me')
  async getCurrentUser(@Req() req: Request, @Res() res: Response) {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    try {
      const currentUser = await this.authService.getCurrentUser(user.sub);
      res.status(200).json(currentUser);
    } catch (error) {
      console.error('AuthController: Get current user error:', error.message);
      res.status(401).json({ message: error.message });
    }
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.status(200).json({ message: 'Logged out successfully' });
  }

  @Get('test-user')
  async testUser(@Res() res: Response) {
    console.log('AuthController: Test user endpoint called');
    try {
      const user = await this.usersService.findOneByEmail('eamonrivas@gmail.com');
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.status(200).json({ message: 'User found', user });
    } catch (error) {
      console.error('AuthController: Test user error:', error.message);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}