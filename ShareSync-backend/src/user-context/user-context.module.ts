// src/user-context/user-context.module.ts
// ═══════════════════════════════════════════════════════════════════════════════
// USER CONTEXT MODULE
// ═══════════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserContext,
  UserContextSchema,
} from './schemas/user-context.schema';
import { UserContextController } from './user-context.controller';
import { UserContextService } from './user-context.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserContext.name, schema: UserContextSchema },
    ]),
  ],
  controllers: [UserContextController],
  providers: [UserContextService],
  exports: [UserContextService],
})
export class UserContextModule {}
