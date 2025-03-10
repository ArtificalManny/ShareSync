import { Module } from '@nestjs/common';
import { UserModule } from '../modules/Users/user.module'; // Adjusted import

@Module({
  imports: [UserModule],
})
export class AuthModule {}