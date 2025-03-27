import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { UsersService } from '@modules/users/users.service';
import { User } from './schemas/user.schema';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findOne(id);
    if (!user) throw new Error('User not found');
    return user;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateData: Partial<User>): Promise<User> {
    const updatedUser = await this.usersService.update(id, updateData);
    if (!updatedUser) throw new Error('User not found');
    return updatedUser;
  }

  @Get('by-username/:username')
  async findByUsername(@Param('username') username: string): Promise<User> {
    const user = await this.usersService.findOne(username);
    if (!user) throw new Error('User not found');
    return user;
  }
}