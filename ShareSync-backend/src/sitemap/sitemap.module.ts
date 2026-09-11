import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SitemapController } from './sitemap.controller';
import { SitemapService } from './sitemap.service';
import { User, UserSchema } from '../user/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SitemapController],
  providers: [SitemapService],
})
export class SitemapModule {}
