import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      return this.usersService.create(createUserDto);
    } catch (error) {
      console.error('Error in create user:', error);
      throw error;
    }
  }

  @Get('by-username/:username')
  async findByUsername(@Param('username') username: string) {
    try {
      return this.usersService.findByUsername(username);
    } catch (error) {
      console.error('Error in findByUsername:', error);
      throw error;
    }
  }

  @Get('by-email/:email')
  async findByEmail(@Param('email') email: string) {
    try {
      return this.usersService.findByEmail(email);
    } catch (error) {
      console.error('Error in findByEmail:', error);
      throw error;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      return this.usersService.update(id, updateUserDto);
    } catch (error) {
      console.error('Error in update user:', error);
      throw error;
    }
  }
}