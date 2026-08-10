import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import {
  InjectModel,
} from '@nestjs/mongoose';
import {
  Model,
} from 'mongoose';

import {
  Feedback,
  FeedbackDocument,
  FeedbackType,
} from './schemas/feedback.schema';

export type CreateFeedbackInput = {
  type?: FeedbackType;
  content?: string;
  route?: string;
  appVersion?: string;
  buildId?: string;
  platform?: string;
  userAgent?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  online?: boolean;
  clientTimestamp?: string;
  recentErrors?: unknown[];
};

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel:
      Model<FeedbackDocument>,
  ) {}

  async create(
    userId: string,
    input: CreateFeedbackInput,
  ) {
    const normalizedUserId =
      String(userId || '').trim();

    if (!normalizedUserId) {
      throw new BadRequestException(
        'Feedback requires an authenticated user',
      );
    }

    const content =
      String(input?.content || '').trim();

    // pilot-feedback-optional-description-v1
    if (content.length > 4000) {
      throw new BadRequestException(
        'Feedback must be 4000 characters or fewer',
      );
    }

    const storedContent =
      content || 'No description provided.';

    const requestedType =
      String(input?.type || 'feedback')
        .trim()
        .toLowerCase();

    const type: FeedbackType =
      requestedType === 'bug'
        ? 'bug'
        : requestedType === 'idea'
          ? 'idea'
          : 'feedback';

    const trimField = (
      value: unknown,
      maximum: number,
    ) =>
      String(value || '')
        .trim()
        .slice(0, maximum);

    const width =
      Number(input?.viewportWidth);

    const height =
      Number(input?.viewportHeight);

    const clientTimestamp =
      input?.clientTimestamp
        ? new Date(input.clientTimestamp)
        : undefined;

    const recentErrors =
      Array.isArray(input?.recentErrors)
        ? input.recentErrors
            .slice(-3)
            .map((value) =>
              String(value || '')
                .trim()
                .slice(0, 1000),
            )
            .filter(Boolean)
        : [];

    const created =
      await this.feedbackModel.create({
        userId: normalizedUserId,
        type,
        content: storedContent,

        // Keep this pathname-only.
        route: trimField(
          input?.route,
          1000,
        ),

        appVersion: trimField(
          input?.appVersion,
          100,
        ),

        buildId: trimField(
          input?.buildId,
          100,
        ),

        platform: trimField(
          input?.platform,
          200,
        ),

        userAgent: trimField(
          input?.userAgent,
          1000,
        ),

        viewportWidth:
          Number.isFinite(width)
            ? Math.max(
                0,
                Math.round(width),
              )
            : undefined,

        viewportHeight:
          Number.isFinite(height)
            ? Math.max(
                0,
                Math.round(height),
              )
            : undefined,

        online:
          typeof input?.online ===
          'boolean'
            ? input.online
            : undefined,

        clientTimestamp:
          clientTimestamp &&
          !Number.isNaN(
            clientTimestamp.getTime(),
          )
            ? clientTimestamp
            : undefined,

        recentErrors,
      });

    return {
      id: String(created._id),
      type: created.type,
      createdAt:
        created.createdAt ||
        new Date(),
    };
  }
}
