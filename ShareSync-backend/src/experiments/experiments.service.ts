import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Experiment, ExperimentDocument } from './experiment.schema';

@Injectable()
export class ExperimentsService {
  constructor(
    @InjectModel(Experiment.name)
    private experimentModel: Model<ExperimentDocument>,
  ) {}

  async create(userId: string, data: Partial<Experiment>) {
    const experiment = new this.experimentModel({
      ...data,
      userId: new Types.ObjectId(userId),
      startDate: new Date(),
      status: 'running',
    });
    return experiment.save();
  }

  async findAll(userId: string) {
    return this.experimentModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async findOne(userId: string, experimentId: string) {
    return this.experimentModel
      .findOne({
        _id: new Types.ObjectId(experimentId),
        userId: new Types.ObjectId(userId),
      })
      .lean();
  }

  async addDataPoint(
    userId: string,
    experimentId: string,
    dataPoint: {
      condition: string;
      metrics: any;
    },
  ) {
    return this.experimentModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(experimentId),
        userId: new Types.ObjectId(userId),
      },
      {
        $push: {
          dataPoints: {
            date: new Date(),
            condition: dataPoint.condition,
            metrics: dataPoint.metrics,
          },
        },
      },
      { new: true },
    );
  }

  async complete(userId: string, experimentId: string, results: any) {
    return this.experimentModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(experimentId),
        userId: new Types.ObjectId(userId),
      },
      {
        status: 'completed',
        endDate: new Date(),
        results,
      },
      { new: true },
    );
  }

  async getInsights(userId: string) {
    const experiments = await this.experimentModel
      .find({
        userId: new Types.ObjectId(userId),
        status: 'completed',
      })
      .lean();

    // Analyze completed experiments to find patterns
    const insights = {
      totalExperiments: experiments.length,
      discoveries: [] as string[],
      recommendations: [] as string[],
    };

    experiments.forEach((exp) => {
      if (exp.results) {
        insights.discoveries.push(
          `${exp.name}: ${exp.results.winner === 'variation' ? 'Experiment worked!' : exp.results.winner === 'control' ? 'Original was better' : 'No clear difference'}`,
        );
        if (exp.results.recommendation) {
          insights.recommendations.push(exp.results.recommendation);
        }
      }
    });

    return insights;
  }
}
