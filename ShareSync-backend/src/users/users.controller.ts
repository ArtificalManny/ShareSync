import { Controller, Get, Param, Put, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { HttpException, HttpStatus } from '@nestjs/common';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('by-username/:username')
  async findByUsername(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return {
      status: 'success',
      data: user,
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return {
      status: 'success',
      data: user,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: any) {
    const updatedUser = await this.usersService.update(id, updateUserDto);
    return {
      status: 'success',
      message: 'User updated successfully',
      data: updatedUser,
    };
  }
}