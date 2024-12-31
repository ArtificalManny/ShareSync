import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) {}

    async validateUser(email: string, pass: string): Promise<User> {
        const user = await this.usersService.findByEmail(email);
        if (user && await bcrypt.compare(pass, user.password)) {
            return user;
        }
        return null;
    }

    async login(user: User) {
        const payload = { username: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                profilePicture: user.profilePicture
            },
        };
    }
}