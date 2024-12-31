import { Injectable, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
//Import User entity and DTOs
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<User> {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
        const user = this.usersRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });
        return this.usersRepository.save(user);
    }

    async findByEmail(email: string): Promise<User | undefined> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findById(id: string): Promise<User | undefined> {
        return this.usersRepository.findOne(id);
    }
}

 