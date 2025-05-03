import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getMe() {
    // Implement authentication to get current user
    return this.userService.findById('userId'); // Replace 'userId' with actual logic
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.userService.update(id, updateData);
  }
}