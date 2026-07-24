// enterprise-sales-inquiry-backend-v1
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserModule } from '../user/user.module';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import {
  EnterpriseInquiry,
  EnterpriseInquirySchema,
} from './schemas/enterprise-inquiry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: EnterpriseInquiry.name,
        schema: EnterpriseInquirySchema,
      },
    ]),
    UserModule,
    NotificationsModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
