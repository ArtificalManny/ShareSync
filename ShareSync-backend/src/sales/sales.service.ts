// enterprise-sales-inquiry-backend-v1
import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmailService } from '../notifications/email.service';
import { UserService } from '../user/user.service';
import { CreateEnterpriseInquiryDto } from './dto/create-enterprise-inquiry.dto';
import {
  EnterpriseInquiry,
  EnterpriseInquiryDocument,
} from './schemas/enterprise-inquiry.schema';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);
  private readonly salesEmail: string;

  constructor(
    @InjectModel(EnterpriseInquiry.name)
    private readonly inquiryModel: Model<EnterpriseInquiryDocument>,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.salesEmail =
      this.configService.get<string>('SALES_EMAIL') ||
      this.configService.get<string>('ENTERPRISE_EMAIL') ||
      'enterprise@openshare.ca';
  }

  async createEnterpriseInquiry(
    userId: string,
    dto: CreateEnterpriseInquiryDto,
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedException(
        'Authenticated user could not be resolved',
      );
    }

    const user = await this.userService.findById(userId);

    if (!user) {
      throw new UnauthorizedException(
        'Authenticated user could not be resolved',
      );
    }

    const currentPlan =
      String(
        dto.currentPlan ||
          (user as any)?.subscription?.plan ||
          (user as any)?.plan ||
          'unknown',
      )
        .trim()
        .slice(0, 40) || 'unknown';

    const inquiry = await this.inquiryModel.create({
      userId: new Types.ObjectId(userId),
      name: dto.name,
      email: dto.email,
      organization: dto.organization,
      teamSize: dto.teamSize,
      useCase: dto.useCase,
      message: dto.message || '',
      currentPlan,
      status: 'new',
      source: 'pricing_modal',
    });

    await this.dispatchInquiryEmails({
      inquiryId: String(inquiry._id),
      name: dto.name,
      email: dto.email,
      organization: dto.organization,
      teamSize: dto.teamSize,
      useCase: dto.useCase,
      message: dto.message || '',
      currentPlan,
      userId,
    });

    const createdAt =
      (inquiry as any)?.createdAt || new Date();

    return {
      inquiryId: String(inquiry._id),
      status: 'received',
      submittedAt:
        createdAt instanceof Date
          ? createdAt.toISOString()
          : String(createdAt),
      message:
        'Thanks — we received your inquiry and will respond within one business day.',
    };
  }

  private async dispatchInquiryEmails(details: {
    inquiryId: string;
    name: string;
    email: string;
    organization: string;
    teamSize: string;
    useCase: string;
    message: string;
    currentPlan: string;
    userId: string;
  }): Promise<void> {
    const safe = {
      inquiryId: this.escapeHtml(details.inquiryId),
      name: this.escapeHtml(details.name),
      email: this.escapeHtml(details.email),
      organization: this.escapeHtml(details.organization),
      teamSize: this.escapeHtml(details.teamSize),
      useCase: this.escapeHtml(
        details.useCase.replace(/-/g, ' '),
      ),
      message: this.escapeHtml(details.message),
      currentPlan: this.escapeHtml(details.currentPlan),
      userId: this.escapeHtml(details.userId),
    };

    const safeSubjectOrganization =
      details.organization
        .replace(/[\r\n]+/g, ' ')
        .trim()
        .slice(0, 120) || 'New organization';

    const internalHtml = `
      <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#18181b">
        <h1 style="font-size:24px;margin-bottom:8px">
          New OpenShare Enterprise inquiry
        </h1>

        <p style="color:#52525b;margin-top:0">
          A signed-in OpenShare user submitted an Enterprise sales request.
        </p>

        <table style="width:100%;border-collapse:collapse;margin-top:24px">
          <tbody>
            ${this.detailRow('Organization', safe.organization)}
            ${this.detailRow('Contact', safe.name)}
            ${this.detailRow('Email', safe.email)}
            ${this.detailRow('Team size', safe.teamSize)}
            ${this.detailRow('Primary need', safe.useCase)}
            ${this.detailRow('Current plan', safe.currentPlan)}
            ${this.detailRow('OpenShare user ID', safe.userId)}
            ${this.detailRow('Inquiry ID', safe.inquiryId)}
          </tbody>
        </table>

        <div style="margin-top:24px;padding:18px;border-radius:14px;background:#f4f4f5">
          <strong>Additional context</strong>
          <p style="margin:10px 0 0;line-height:1.6">
            ${
              safe.message
                ? safe.message.replace(/\n/g, '<br>')
                : 'No additional message was provided.'
            }
          </p>
        </div>
      </div>
    `;

    const internalText = [
      'New OpenShare Enterprise inquiry',
      `Organization: ${details.organization}`,
      `Contact: ${details.name}`,
      `Email: ${details.email}`,
      `Team size: ${details.teamSize}`,
      `Primary need: ${details.useCase.replace(/-/g, ' ')}`,
      `Current plan: ${details.currentPlan}`,
      `OpenShare user ID: ${details.userId}`,
      `Inquiry ID: ${details.inquiryId}`,
      '',
      details.message || 'No additional message was provided.',
    ].join('\n');

    const confirmationHtml = `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#18181b">
        <div style="display:inline-block;padding:7px 12px;border-radius:999px;background:#ede9fe;color:#6d28d9;font-size:12px;font-weight:700">
          OpenShare Enterprise
        </div>

        <h1 style="font-size:26px;margin:20px 0 10px">
          Thanks, ${safe.name}.
        </h1>

        <p style="font-size:16px;line-height:1.65;color:#52525b">
          We received your Enterprise inquiry for
          <strong>${safe.organization}</strong>.
          We will review what your organization needs and respond within one business day.
        </p>

        <div style="margin-top:24px;padding:18px;border-radius:14px;background:#f4f4f5">
          <strong>Your request</strong>
          <p style="margin:10px 0 0;color:#52525b;line-height:1.6">
            Team size: ${safe.teamSize}<br>
            Primary need: ${safe.useCase}
          </p>
        </div>

        <p style="margin-top:24px;color:#71717a;font-size:14px">
          You do not need to send another message. This confirmation means your request was recorded.
        </p>
      </div>
    `;

    const confirmationText = [
      `Thanks, ${details.name}.`,
      '',
      `We received your OpenShare Enterprise inquiry for ${details.organization}.`,
      'We will review it and respond within one business day.',
      '',
      `Team size: ${details.teamSize}`,
      `Primary need: ${details.useCase.replace(/-/g, ' ')}`,
    ].join('\n');

    const results = await Promise.allSettled([
      this.emailService.sendDirectEmail({
        to: this.salesEmail,
        subject:
          `New Enterprise inquiry — ${safeSubjectOrganization}`,
        html: internalHtml,
        text: internalText,
      }),
      this.emailService.sendDirectEmail({
        to: details.email,
        subject:
          'We received your OpenShare Enterprise inquiry',
        html: confirmationHtml,
        text: confirmationText,
      }),
    ]);

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const channel =
          index === 0
            ? 'internal sales notification'
            : 'customer confirmation';

        this.logger.error(
          `Failed to dispatch ${channel}`,
          result.reason instanceof Error
            ? result.reason.stack
            : String(result.reason),
        );
      }
    });
  }

  private detailRow(label: string, value: string): string {
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e4e4e7;color:#71717a;width:180px">
          ${label}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e4e4e7;font-weight:600">
          ${value}
        </td>
      </tr>
    `;
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
