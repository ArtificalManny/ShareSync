import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExperimentsService } from './experiments.service';

@Controller('experiments')
@UseGuards(JwtAuthGuard)
export class ExperimentsController {
  constructor(private readonly experiments: ExperimentsService) {}

  /**
   * GET /api/experiments
   * Get all experiments for the authenticated user
   */
  @Get()
  async list(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.id;
    return this.experiments.findAll(userId);
  }

  /**
   * POST /api/experiments
   * Create a new experiment
   */
  @Post()
  async create(@Req() req: any, @Body() body: any) {
    const userId = req?.user?.sub || req?.user?.id;

    if (!body.name || !body.type || !body.hypothesis) {
      throw new HttpException(
        'name, type, and hypothesis are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.experiments.create(userId, body);
  }

  /**
   * GET /api/experiments/:id
   * Get a specific experiment
   */
  @Get(':id')
  async getOne(@Req() req: any, @Param('id') id: string) {
    const userId = req?.user?.sub || req?.user?.id;
    const experiment = await this.experiments.findOne(userId, id);

    if (!experiment) {
      throw new HttpException('Experiment not found', HttpStatus.NOT_FOUND);
    }

    return experiment;
  }

  /**
   * POST /api/experiments/:id/data
   * Add a data point to an experiment
   */
  @Post(':id/data')
  async addData(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { condition: string; metrics: any },
  ) {
    const userId = req?.user?.sub || req?.user?.id;

    if (!body.condition || !body.metrics) {
      throw new HttpException(
        'condition and metrics are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.experiments.addDataPoint(userId, id, body);
  }

  /**
   * PATCH /api/experiments/:id/complete
   * Mark experiment as complete with results
   */
  @Patch(':id/complete')
  async complete(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { results: any },
  ) {
    const userId = req?.user?.sub || req?.user?.id;

    if (!body.results) {
      throw new HttpException('results are required', HttpStatus.BAD_REQUEST);
    }

    return this.experiments.complete(userId, id, body.results);
  }

  /**
   * GET /api/experiments/insights/me
   * Get personalized insights from completed experiments
   */
  @Get('insights/me')
  async getInsights(@Req() req: any) {
    const userId = req?.user?.sub || req?.user?.id;
    return this.experiments.getInsights(userId);
  }
}
