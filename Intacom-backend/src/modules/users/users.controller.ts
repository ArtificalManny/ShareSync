import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: Partial<User>): Promise<{ data: { user: User } }> {
    const user = await this.usersService.create(createUserDto);
    return { data: { user } };
  }

  @Get('by-username/:username')
  async findByUsername(@Param('username') username: string): Promise<{ data: { user: User } }> {
    const user = await this.usersService.findByUsername(username);
    if (!user) throw new Error('User not found');
    return { data: { user } };
  }

  @Get('by-email/:email')
  async findByEmail(@Param('email') email: string): Promise<{ data: { user: User } }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new Error('User not found');
    return { data: { user } };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: Partial<User>): Promise<{ data: { user: User } }> {
    const updatedUser = await this.usersService.update(id, updateUserDto);
    if (!updatedUser) throw new Error('User not found');
    return { data: { user: updatedUser } };
  }
}