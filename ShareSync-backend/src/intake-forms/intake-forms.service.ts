import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InjectModel,
} from '@nestjs/mongoose';
import {
  Model,
  Types,
} from 'mongoose';
import {
  randomBytes,
} from 'crypto';

import {
  TasksService,
} from '../tasks/tasks.service';
import {
  CreateTaskDto,
} from '../tasks/dto/create-task.dto';
import {
  TaskPriority,
  TaskStatus,
} from '../tasks/schemas/task.schema';

import {
  CreateIntakeFormDto,
  IntakeFormFieldDto,
} from './dto/create-intake-form.dto';
import {
  CreateIntakeSubmissionDto,
} from './dto/create-intake-submission.dto';
import {
  ConvertIntakeSubmissionDto,
  UpdateIntakeSubmissionStatusDto,
} from './dto/update-intake-submission.dto';
import {
  UpdateIntakeFormDto,
} from './dto/update-intake-form.dto';
import {
  IntakeFieldType,
  IntakeForm,
  IntakeFormDocument,
} from './schemas/intake-form.schema';
import {
  IntakeConversionStatus,
  IntakeSubmission,
  IntakeSubmissionDocument,
  IntakeSubmissionStatus,
} from './schemas/intake-submission.schema';

const MAX_FORMS_PER_PROJECT = 20;
const MAX_SUBMISSIONS_PER_FORM = 10000;

@Injectable()
export class IntakeFormsService {
  constructor(
    @InjectModel(IntakeForm.name)
    private readonly intakeFormModel:
      Model<IntakeFormDocument>,

    @InjectModel(IntakeSubmission.name)
    private readonly submissionModel:
      Model<IntakeSubmissionDocument>,

    private readonly tasksService:
      TasksService,
  ) {}

  async list(projectId: string) {
    return this.intakeFormModel
      .find({
        projectId:
          new Types.ObjectId(projectId),
      })
      .sort({
        createdAt: -1,
      })
      .lean();
  }

  async findOne(
    projectId: string,
    formId: string,
  ) {
    const form =
      await this.intakeFormModel
        .findOne({
          _id: new Types.ObjectId(formId),
          projectId:
            new Types.ObjectId(projectId),
        })
        .lean();

    if (!form) {
      throw new NotFoundException(
        'Intake form not found.',
      );
    }

    return form;
  }

  async create(
    projectId: string,
    userId: string,
    dto: CreateIntakeFormDto,
  ) {
    const existingCount =
      await this.intakeFormModel
        .countDocuments({
          projectId:
            new Types.ObjectId(projectId),
        });

    if (
      existingCount >=
      MAX_FORMS_PER_PROJECT
    ) {
      throw new BadRequestException(
        `A project can have at most ${MAX_FORMS_PER_PROJECT} intake forms.`,
      );
    }

    const name = this.requireText(
      dto.name,
      'Form name',
    );

    const slug =
      await this.generateUniqueSlug(name);

    const form =
      await this.intakeFormModel.create({
        projectId:
          new Types.ObjectId(projectId),
        name,
        description:
          String(dto.description || '').trim(),
        slug,
        enabled: dto.enabled !== false,
        fields:
          this.normalizeFields(dto.fields),
        successMessage:
          String(
            dto.successMessage ||
              'Thanks — your request has been submitted.',
          ).trim(),
        createdBy:
          new Types.ObjectId(userId),
        updatedBy:
          new Types.ObjectId(userId),
      });

    return form.toObject();
  }

  async update(
    projectId: string,
    formId: string,
    userId: string,
    dto: UpdateIntakeFormDto,
  ) {
    const patch: Record<string, unknown> = {
      updatedBy:
        new Types.ObjectId(userId),
    };

    if (dto.name !== undefined) {
      patch.name = this.requireText(
        dto.name,
        'Form name',
      );
    }

    if (dto.description !== undefined) {
      patch.description =
        String(dto.description).trim();
    }

    if (dto.enabled !== undefined) {
      patch.enabled =
        Boolean(dto.enabled);
    }

    if (dto.fields !== undefined) {
      patch.fields =
        this.normalizeFields(dto.fields);
    }

    if (
      dto.successMessage !== undefined
    ) {
      patch.successMessage =
        this.requireText(
          dto.successMessage,
          'Success message',
        );
    }

    const form =
      await this.intakeFormModel
        .findOneAndUpdate(
          {
            _id:
              new Types.ObjectId(formId),
            projectId:
              new Types.ObjectId(projectId),
          },
          {
            $set: patch,
          },
          {
            new: true,
          },
        )
        .lean();

    if (!form) {
      throw new NotFoundException(
        'Intake form not found.',
      );
    }

    return form;
  }

  async setEnabled(
    projectId: string,
    formId: string,
    userId: string,
    enabled: boolean,
  ) {
    const form =
      await this.intakeFormModel
        .findOneAndUpdate(
          {
            _id:
              new Types.ObjectId(formId),
            projectId:
              new Types.ObjectId(projectId),
          },
          {
            $set: {
              enabled:
                Boolean(enabled),
              updatedBy:
                new Types.ObjectId(userId),
            },
          },
          {
            new: true,
          },
        )
        .lean();

    if (!form) {
      throw new NotFoundException(
        'Intake form not found.',
      );
    }

    return form;
  }

  async remove(
    projectId: string,
    formId: string,
  ) {
    const filter = {
      _id:
        new Types.ObjectId(formId),
      projectId:
        new Types.ObjectId(projectId),
    };

    const form =
      await this.intakeFormModel
        .findOne(filter)
        .select('_id')
        .lean();

    if (!form) {
      throw new NotFoundException(
        'Intake form not found.',
      );
    }

    await Promise.all([
      this.submissionModel.deleteMany({
        formId:
          new Types.ObjectId(formId),
        projectId:
          new Types.ObjectId(projectId),
      }),
      this.intakeFormModel.deleteOne(
        filter,
      ),
    ]);
  }

  async listSubmissions(
    projectId: string,
    formId: string,
    status?: IntakeSubmissionStatus,
  ) {
    await this.findOne(
      projectId,
      formId,
    );

    const filter: Record<string, unknown> = {
      projectId:
        new Types.ObjectId(projectId),
      formId:
        new Types.ObjectId(formId),
    };

    if (status) {
      if (
        !Object.values(
          IntakeSubmissionStatus,
        ).includes(status)
      ) {
        throw new BadRequestException(
          'Invalid submission status.',
        );
      }

      filter.status = status;
    }

    return this.submissionModel
      .find(filter)
      .sort({
        submittedAt: -1,
      })
      .limit(250)
      .lean();
  }

  async findSubmission(
    projectId: string,
    formId: string,
    submissionId: string,
  ) {
    const submission =
      await this.submissionModel
        .findOne({
          _id:
            new Types.ObjectId(
              submissionId,
            ),
          projectId:
            new Types.ObjectId(projectId),
          formId:
            new Types.ObjectId(formId),
        })
        .lean();

    if (!submission) {
      throw new NotFoundException(
        'Submission not found.',
      );
    }

    return submission;
  }

  async updateSubmissionStatus(
    projectId: string,
    formId: string,
    submissionId: string,
    dto:
      UpdateIntakeSubmissionStatusDto,
  ) {
    const submission =
      await this.submissionModel
        .findOneAndUpdate(
          {
            _id:
              new Types.ObjectId(
                submissionId,
              ),
            projectId:
              new Types.ObjectId(
                projectId,
              ),
            formId:
              new Types.ObjectId(formId),
          },
          {
            $set: {
              status: dto.status,
            },
          },
          {
            new: true,
          },
        )
        .lean();

    if (!submission) {
      throw new NotFoundException(
        'Submission not found.',
      );
    }

    return submission;
  }

  async getPublicForm(slug: string) {
    const normalizedSlug =
      String(slug || '')
        .trim()
        .toLowerCase();

    const form =
      await this.intakeFormModel
        .findOne({
          slug: normalizedSlug,
          enabled: true,
        })
        .lean();

    if (!form) {
      throw new NotFoundException(
        'This intake form is unavailable.',
      );
    }

    return {
      id: String(form._id),
      name: form.name,
      description:
        form.description || '',
      slug: form.slug,
      fields: form.fields || [],
      successMessage:
        form.successMessage,
    };
  }

  async submitPublic(
    slug: string,
    dto: CreateIntakeSubmissionDto,
    source: {
      userAgent?: string;
      referer?: string;
    },
  ) {
    const normalizedSlug =
      String(slug || '')
        .trim()
        .toLowerCase();

    const form =
      await this.intakeFormModel
        .findOne({
          slug: normalizedSlug,
          enabled: true,
        });

    if (!form) {
      throw new NotFoundException(
        'This intake form is unavailable.',
      );
    }

    if (
      Number(
        form.submissionCount || 0,
      ) >= MAX_SUBMISSIONS_PER_FORM
    ) {
      throw new BadRequestException(
        'This intake form has reached its submission limit.',
      );
    }

    const answers =
      this.validateAndNormalizeAnswers(
        form.fields || [],
        dto.answers || [],
      );

    const submission =
      await this.submissionModel.create({
        formId: form._id,
        projectId: form.projectId,
        answers,
        status:
          IntakeSubmissionStatus.NEW,
        source: {
          userAgent:
            String(
              source.userAgent || '',
            ).slice(0, 500),
          referer:
            String(
              source.referer || '',
            ).slice(0, 1000),
        },
        submittedAt: new Date(),
      });

    await this.intakeFormModel
      .updateOne(
        {
          _id: form._id,
        },
        {
          $inc: {
            submissionCount: 1,
          },
        },
      );

    return {
      id: String(submission._id),
      submittedAt:
        submission.submittedAt,
      successMessage:
        form.successMessage,
    };
  }

  async convertSubmissionToMove(
    projectId: string,
    formId: string,
    submissionId: string,
    userId: string,
    dto: ConvertIntakeSubmissionDto,
  ) {
    const form =
      await this.intakeFormModel
        .findOne({
          _id:
            new Types.ObjectId(formId),
          projectId:
            new Types.ObjectId(projectId),
        })
        .lean();

    if (!form) {
      throw new NotFoundException(
        'Intake form not found.',
      );
    }

    const existing =
      await this.submissionModel
        .findOne({
          _id:
            new Types.ObjectId(
              submissionId,
            ),
          formId:
            new Types.ObjectId(formId),
          projectId:
            new Types.ObjectId(projectId),
        })
        .lean();

    if (!existing) {
      throw new NotFoundException(
        'Submission not found.',
      );
    }

    if (existing.convertedTaskId) {
      throw new ConflictException(
        'This submission has already been converted to a Move.',
      );
    }

    const claimed =
      await this.submissionModel
        .findOneAndUpdate(
          {
            _id:
              new Types.ObjectId(
                submissionId,
              ),
            formId:
              new Types.ObjectId(formId),
            projectId:
              new Types.ObjectId(
                projectId,
              ),
            convertedTaskId: null,
            conversionStatus: {
              $ne:
                IntakeConversionStatus
                  .PROCESSING,
            },
          },
          {
            $set: {
              conversionStatus:
                IntakeConversionStatus
                  .PROCESSING,
              conversionError: '',
            },
          },
          {
            new: true,
          },
        );

    if (!claimed) {
      throw new ConflictException(
        'This submission is already being converted.',
      );
    }

    try {
      const taskDto: CreateTaskDto = {
        projectId,
        title:
          this.buildMoveTitle(
            form.name,
            claimed.answers,
            dto.title,
          ),
        description:
          dto.description?.trim() ||
          this.buildMoveDescription(
            form.name,
            form.slug,
            claimed.answers,
          ),
        status:
          dto.status ||
          TaskStatus.BACKLOG,
        priority:
          dto.priority ||
          TaskPriority.MEDIUM,
        assigneeId:
          dto.assigneeId,
        tags: [
          'intake',
          `intake:${form.slug}`,
        ],
      };

      const task =
        await this.tasksService.create(
          userId,
          taskDto,
        );

      const updatedSubmission =
        await this.submissionModel
          .findByIdAndUpdate(
            claimed._id,
            {
              $set: {
                status:
                  IntakeSubmissionStatus
                    .ACCEPTED,
                convertedTaskId:
                  task._id,
                convertedBy:
                  new Types.ObjectId(
                    userId,
                  ),
                convertedAt:
                  new Date(),
                conversionStatus:
                  IntakeConversionStatus
                    .CONVERTED,
                conversionError: '',
              },
            },
            {
              new: true,
            },
          )
          .lean();

      return {
        submission:
          updatedSubmission,
        task,
      };
    } catch (error: any) {
      await this.submissionModel
        .updateOne(
          {
            _id: claimed._id,
          },
          {
            $set: {
              conversionStatus:
                IntakeConversionStatus
                  .FAILED,
              conversionError:
                String(
                  error?.message ||
                    'Move conversion failed.',
                ).slice(0, 500),
            },
          },
        );

      throw error;
    }
  }

  private normalizeFields(
    fields: IntakeFormFieldDto[],
  ) {
    const ids = new Set<string>();

    return fields.map(
      (field, index) => {
        const label =
          this.requireText(
            field.label,
            `Field ${index + 1} label`,
          );

        let id =
          String(field.id || '')
            .trim()
            .replace(
              /[^a-zA-Z0-9_-]/g,
              '',
            )
            .slice(0, 64);

        if (!id) {
          id =
            randomBytes(6)
              .toString('hex');
        }

        if (ids.has(id)) {
          throw new BadRequestException(
            `Duplicate field ID: ${id}`,
          );
        }

        ids.add(id);

        const options =
          Array.from(
            new Set(
              (field.options || [])
                .map((value) =>
                  String(value).trim(),
                )
                .filter(Boolean),
            ),
          );

        if (
          field.type ===
            IntakeFieldType.DROPDOWN &&
          options.length < 2
        ) {
          throw new BadRequestException(
            `"${label}" needs at least two dropdown options.`,
          );
        }

        return {
          id,
          type: field.type,
          label,
          required:
            Boolean(field.required),
          placeholder:
            String(
              field.placeholder || '',
            ).trim(),
          options:
            field.type ===
            IntakeFieldType.DROPDOWN
              ? options
              : [],
        };
      },
    );
  }

  private validateAndNormalizeAnswers(
    fields: any[],
    incomingAnswers: Array<{
      fieldId: string;
      value: unknown;
    }>,
  ) {
    const fieldMap =
      new Map(
        fields.map((field) => [
          String(field.id),
          field,
        ]),
      );

    const received =
      new Map<string, unknown>();

    for (
      const answer of incomingAnswers
    ) {
      const fieldId =
        String(answer.fieldId || '')
          .trim();

      if (!fieldMap.has(fieldId)) {
        throw new BadRequestException(
          `Unknown intake field: ${fieldId}`,
        );
      }

      if (received.has(fieldId)) {
        throw new BadRequestException(
          `Duplicate answer for field: ${fieldId}`,
        );
      }

      received.set(
        fieldId,
        answer.value,
      );
    }

    const normalized: Array<{
      fieldId: string;
      label: string;
      type: IntakeFieldType;
      value: unknown;
    }> = [];

    for (const field of fields) {
      const fieldId =
        String(field.id);
      const hasAnswer =
        received.has(fieldId);
      const raw =
        received.get(fieldId);

      if (
        field.required &&
        this.isMissingValue(
          field.type,
          raw,
          hasAnswer,
        )
      ) {
        throw new BadRequestException(
          `"${field.label}" is required.`,
        );
      }

      if (!hasAnswer) {
        continue;
      }

      if (
        !field.required &&
        this.isMissingValue(
          field.type,
          raw,
          true,
        )
      ) {
        continue;
      }

      normalized.push({
        fieldId,
        label: field.label,
        type: field.type,
        value:
          this.normalizeAnswerValue(
            field,
            raw,
          ),
      });
    }

    return normalized;
  }

  private normalizeAnswerValue(
    field: any,
    raw: unknown,
  ): unknown {
    switch (field.type) {
      case IntakeFieldType.SHORT_TEXT: {
        if (
          typeof raw !== 'string'
        ) {
          throw new BadRequestException(
            `"${field.label}" must be text.`,
          );
        }

        const value = raw.trim();

        if (value.length > 500) {
          throw new BadRequestException(
            `"${field.label}" is too long.`,
          );
        }

        return value;
      }

      case IntakeFieldType.LONG_TEXT: {
        if (
          typeof raw !== 'string'
        ) {
          throw new BadRequestException(
            `"${field.label}" must be text.`,
          );
        }

        const value = raw.trim();

        if (value.length > 5000) {
          throw new BadRequestException(
            `"${field.label}" is too long.`,
          );
        }

        return value;
      }

      case IntakeFieldType.EMAIL: {
        if (
          typeof raw !== 'string'
        ) {
          throw new BadRequestException(
            `"${field.label}" must be an email address.`,
          );
        }

        const value =
          raw.trim().toLowerCase();

        if (
          value.length > 320 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            value,
          )
        ) {
          throw new BadRequestException(
            `"${field.label}" is not a valid email address.`,
          );
        }

        return value;
      }

      case IntakeFieldType.NUMBER: {
        const value =
          typeof raw === 'number'
            ? raw
            : Number(raw);

        if (
          !Number.isFinite(value)
        ) {
          throw new BadRequestException(
            `"${field.label}" must be a number.`,
          );
        }

        return value;
      }

      case IntakeFieldType.DATE: {
        if (
          typeof raw !== 'string'
        ) {
          throw new BadRequestException(
            `"${field.label}" must be a date.`,
          );
        }

        const date =
          new Date(raw);

        if (
          Number.isNaN(
            date.getTime(),
          )
        ) {
          throw new BadRequestException(
            `"${field.label}" is not a valid date.`,
          );
        }

        return date
          .toISOString()
          .slice(0, 10);
      }

      case IntakeFieldType.DROPDOWN: {
        if (
          typeof raw !== 'string'
        ) {
          throw new BadRequestException(
            `"${field.label}" must use one of its options.`,
          );
        }

        const value = raw.trim();

        if (
          !Array.isArray(
            field.options,
          ) ||
          !field.options.includes(
            value,
          )
        ) {
          throw new BadRequestException(
            `"${field.label}" contains an invalid option.`,
          );
        }

        return value;
      }

      case IntakeFieldType.CHECKBOX: {
        if (
          typeof raw !== 'boolean'
        ) {
          throw new BadRequestException(
            `"${field.label}" must be true or false.`,
          );
        }

        return raw;
      }

      default:
        throw new BadRequestException(
          `Unsupported field type: ${field.type}`,
        );
    }
  }

  private isMissingValue(
    type: IntakeFieldType,
    value: unknown,
    hasAnswer: boolean,
  ) {
    if (!hasAnswer) {
      return true;
    }

    if (
      type ===
      IntakeFieldType.CHECKBOX
    ) {
      return value !== true;
    }

    if (
      value === null ||
      value === undefined
    ) {
      return true;
    }

    return (
      typeof value === 'string' &&
      value.trim() === ''
    );
  }

  private buildMoveTitle(
    formName: string,
    answers: any[],
    explicitTitle?: string,
  ) {
    const requested =
      String(explicitTitle || '')
        .trim();

    if (requested) {
      return requested.slice(0, 500);
    }

    const useful =
      answers.find(
        (answer) =>
          [
            IntakeFieldType.SHORT_TEXT,
            IntakeFieldType.EMAIL,
          ].includes(answer.type) &&
          typeof answer.value ===
            'string' &&
          answer.value.trim(),
      );

    if (useful) {
      return `${formName}: ${useful.value}`
        .slice(0, 500);
    }

    return `${formName} submission`
      .slice(0, 500);
  }

  private buildMoveDescription(
    formName: string,
    slug: string,
    answers: any[],
  ) {
    const lines = [
      `Created from intake form: ${formName}`,
      `Intake reference: ${slug}`,
      '',
      ...answers.map(
        (answer) =>
          `**${answer.label}:** ${this.answerToText(
            answer.value,
          )}`,
      ),
    ];

    return lines
      .join('\n')
      .slice(0, 10000);
  }

  private answerToText(
    value: unknown,
  ) {
    if (
      typeof value === 'boolean'
    ) {
      return value ? 'Yes' : 'No';
    }

    if (
      value === null ||
      value === undefined
    ) {
      return '';
    }

    return String(value);
  }

  private async generateUniqueSlug(
    name: string,
  ) {
    const base =
      this.slugify(name) ||
      'intake';

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const suffix =
        randomBytes(4)
          .toString('hex');

      const slug =
        `${base}-${suffix}`
          .slice(0, 180);

      const exists =
        await this.intakeFormModel
          .exists({
            slug,
          });

      if (!exists) {
        return slug;
      }
    }

    throw new ConflictException(
      'Could not generate a unique intake link.',
    );
  }

  private slugify(value: string) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
      .replace(
        /[^a-z0-9]+/g,
        '-',
      )
      .replace(/^-+|-+$/g, '')
      .slice(0, 140);
  }

  private requireText(
    value: unknown,
    label: string,
  ) {
    const text =
      String(value || '').trim();

    if (!text) {
      throw new BadRequestException(
        `${label} is required.`,
      );
    }

    return text;
  }
}
