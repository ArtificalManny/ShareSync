import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';
import { IdeaSchema } from './idea.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Idea', schema: IdeaSchema }]),
  ],
  controllers: [IdeasController],
  providers: [IdeasService],
})
export class IdeasModule {}