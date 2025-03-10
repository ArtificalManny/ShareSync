import { Module } from '@nestjs/common';
import { UserModule } from '../modules/users/user.module'; // Fixed case: Users -> users

@Module({
  imports: [UserModule],
})
export class AuthModule {}