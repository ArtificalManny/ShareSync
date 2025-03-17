import { Module } from '@nestjs/common';
import { UserModule } from '../../modules/users/user.module'; // Adjust based on relative path

@Module({
  imports: [UserModule],
})
export class AuthModule {}