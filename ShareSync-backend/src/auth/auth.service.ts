import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoggingService } from '../logging/logging.service';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private loggingService: LoggingService,
  ) {}

  private transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  async validateUser(email: string, pass: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        this.loggingService.error(`Invalid credentials: User not found for email ${email}`);
        throw new UnauthorizedException('Invalid credentials: User not found');
      }
      const isMatch = await bcrypt.compare(pass, user.password);
      if (!isMatch) {
        this.loggingService.error(`Invalid credentials: Incorrect password for email ${email}`);
        throw new UnauthorizedException('Invalid credentials: Incorrect password');
      }
      this.loggingService.log(`User ${email} validated successfully`);
      return user;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      this.loggingService.error(`Error validating user ${email}`, err.stack);
      throw new UnauthorizedException('Error validating user: ' + err.message);
    }
  }

  async login(user: any) {
    try {
      const payload = { email: user.email, sub: user._id };
      const result = {
        accessToken: this.jwtService.sign(payload),
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
        },
      };
      this.loggingService.log(`User ${user.email} logged in successfully`);
      return result;
    } catch (err) {
      this.loggingService.error(`Error generating login token for user ${user.email}`, err.stack);
      throw new UnauthorizedException('Error generating login token: ' + err.message);
    }
  }

  async register(username: string, email: string, password: string) {
    try {
      const existingUser = await this.usersService.findByEmail(email);
      if (existingUser) {
        this.loggingService.error(`Registration failed: Email ${email} already exists`);
        throw new UnauthorizedException('Email already exists');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.usersService.create({ username, email, password: hashedPassword });
      const token = this.jwtService.sign({ email: user.email, sub: user._id });

      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your ShareSync Account',
        html: `
          <p>Please verify your email by clicking the link below:</p>
          <a href="${process.env.FRONTEND_URL}/verify-email?token=${token}">Verify Email</a>
        `,
      });

      setTimeout(() => {
        this.transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Welcome to ShareSync - Getting Started',
          html: `
            <h1>Welcome to ShareSync, ${username}!</h1>
            <p>Here are a few steps to get started:</p>
            <ol>
              <li>Create your first project.</li>
              <li>Invite your team members.</li>
              <li>Start collaborating in real-time!</li>
            </ol>
            <p>Visit <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a> to get started.</p>
          `,
        });
      }, 1000 * 60 * 5);

      setTimeout(() => {
        this.transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'ShareSync Tips - Day 2',
          html: `
            <h1>ShareSync Tips for ${username}</h1>
            <p>Here are some tips to make the most of ShareSync:</p>
            <ul>
              <li>Use the Team Dashboard to track your team's progress.</li>
              <li>Check the Leaderboard to see top contributors.</li>
              <li>Submit a feature request in the Feedback section!</li>
            </ul>
            <p>Visit <a href="${process.env.FRONTEND_URL}/team-dashboard">${process.env.FRONTEND_URL}/team-dashboard</a> to view your dashboard.</p>
          `,
        });
      }, 1000 * 60 * 60 * 24 * 2);

      this.loggingService.log(`User ${email} registered successfully`);
      return { message: 'Registration successful. Please check your email to verify your account.' };
    } catch (err) {
      this.loggingService.error(`Error during registration for email ${email}`, err.stack);
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Error during registration: ' + err.message);
    }
  }

  async verifyEmail(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        this.loggingService.error(`Email verification failed: User not found for token`);
        throw new UnauthorizedException('Invalid verification token: User not found');
      }
      this.loggingService.log(`Email verified successfully for ${payload.email}`);
      return { message: 'Email verified successfully. You can now log in.' };
    } catch (err) {
      this.loggingService.error(`Error verifying email with token`, err.stack);
      throw new UnauthorizedException('Error verifying email: ' + (err.message || 'Invalid token'));
    }
  }

  async forgotPassword(email: string) {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        this.loggingService.error(`Password reset failed: User not found for email ${email}`);
        throw new UnauthorizedException('User not found');
      }
      const token = this.jwtService.sign({ email: user.email, sub: user._id });

      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset Your ShareSync Password',
        html: `
          <p>Please reset your password by clicking the link below:</p>
          <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}">Reset Password</a>
        `,
      });

      this.loggingService.log(`Password reset link sent to ${email}`);
      return { message: 'Password reset link sent to your email.' };
    } catch (err) {
      this.loggingService.error(`Error sending password reset email to ${email}`, err.stack);
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Error sending password reset email: ' + err.message);
    }
  }

  async resetPassword(token: string, password: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        this.loggingService.error(`Password reset failed: User not found for token`);
        throw new UnauthorizedException('Invalid reset token: User not found');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      await user.save();
      this.loggingService.log(`Password reset successfully for ${payload.email}`);
      return { message: 'Password reset successfully. You can now log in with your new password.' };
    } catch (err) {
      this.loggingService.error(`Error resetting password with token`, err.stack);
      throw new UnauthorizedException('Error resetting password: ' + (err.message || 'Invalid token'));
    }
  }
}