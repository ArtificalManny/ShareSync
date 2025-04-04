import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('by-username/:username')
  async findByUsername(@Param('username') username: string) {
    try {
      const user = await this.usersService.findByUsername(username);
      if (!user) {
        throw new Error('User not found');
      }
      return { data: user };
    } catch (error) {
      console.error('Error in findByUsername:', error);
      throw error;
    }
  }

  @Get('by-id/:id')
  async findById(@Param('id') id: string) {
    try {
      return await this.usersService.findById(id);
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.usersService.findAll();
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updates: Partial<User>) {
    try {
      return await this.usersService.update(id, updates);
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }
}