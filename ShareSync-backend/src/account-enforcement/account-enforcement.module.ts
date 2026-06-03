import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../user/schemas/user.schema';
import { AccountEnforcementController } from './account-enforcement.controller';
import { AccountEnforcementService } from './account-enforcement.service';
import { AdminGuard } from './admin.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AccountEnforcementController],
  providers: [AccountEnforcementService, AdminGuard],
  exports: [AccountEnforcementService],
})
export class AccountEnforcementModule {}
