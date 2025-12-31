import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExperimentsController } from './experiments.controller';
import { ExperimentsService } from './experiments.service';
import { Experiment, ExperimentSchema } from './experiment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Experiment.name, schema: ExperimentSchema },
    ]),
  ],
  controllers: [ExperimentsController],
  providers: [ExperimentsService],
  exports: [ExperimentsService],
})
export class ExperimentsModule {}
