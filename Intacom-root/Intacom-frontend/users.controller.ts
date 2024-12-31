import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) {}

    @Post('register')
    async register(@Body() CreateUserDto: CreateUserDto) {
        const existingUser = await this.usersService.findByEmail(createUserDto.email);
        if (existingUser) {
            throw new HttpException('Email already in use', HttpStatus.BAD_REQUEST);
        }
        const user = await this.usersService.create(createUserDto);
        return { id: user.id, email: user.email, name: user.name };
    }
}