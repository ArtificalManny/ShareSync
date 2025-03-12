import { Module } from '@nestjs/common';
import { UserModule } from '../../modules/users/user.module'; // Adjusted path

@Module({
  imports: [UserModule],
})
export class AuthModule {}