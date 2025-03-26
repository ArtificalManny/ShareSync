import { Controller, Post, Body, Get, Query, Put, Param } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('users')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() userData: any) {
    const user = await this.authService.register(userData);
    return { data: { user } };
  }

  @Post('login')
  async login(@Body() loginData: { identifier: string; password: string }) {
    const user = await this.authService.login(loginData.identifier, loginData.password);
    return { data: { user } };
  }

  @Get('recover')
  async recover(@Query('email') email: string) {
    return this.authService.recover(email);
  }

  @Put('reset')
  async reset(@Body() resetData: { token: string; newPassword: string }) {
    return this.authService.reset(resetData.token, resetData.newPassword);
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() userData: any) {
    const user = await this.authService.updateUser(id, userData);
    return { data: { user } };
  }
}