import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { User, UserDocument } from '../user/schemas/user.schema';
import {
  AccountStatusDto,
  EnforcementReasonDto,
  UpdateAccountStatusDto,
} from './dto/update-account-status.dto';

@Injectable()
export class AccountEnforcementService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getStatus(userId: string) {
    const user = await this.findUser(userId);

    return {
      userId: String(user._id),
      email: user.email,
      username: user.username,
      accountStatus: user.accountStatus || 'active',
      accountStatusReason: user.accountStatusReason || '',
      accountStatusNote: user.accountStatusNote || '',
      accountStatusChangedAt: user.accountStatusChangedAt || null,
      accountStatusChangedBy: user.accountStatusChangedBy || null,
      suspendedUntil: user.suspendedUntil || null,
      warnings: user.warnings || [],
    };
  }

  async updateStatus(userId: string, dto: UpdateAccountStatusDto, actorId?: string) {
    const status = dto.status;
    const reason = String(dto.reason || '').trim();
    const internalNote = String(dto.internalNote || '').trim();
    const changedBy = this.resolveActorId(actorId || dto.changedBy);

    this.validateStatusPayload(status, dto.suspendedUntil);

    const update: any = {
      accountStatus: status,
      accountStatusReason: reason,
      accountStatusNote: internalNote,
      accountStatusChangedAt: new Date(),
      accountStatusChangedBy: changedBy,
    };

    if (status === AccountStatusDto.SUSPENDED) {
      update.suspendedUntil = dto.suspendedUntil
        ? new Date(dto.suspendedUntil)
        : undefined;
    } else {
      update.suspendedUntil = undefined;
    }

    if (status === AccountStatusDto.WARNED) {
      update.$push = {
        warnings: {
          reason,
          note: internalNote,
          issuedAt: new Date(),
          issuedBy: changedBy,
        },
      };
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, update, { new: true })
      .select('-password -verificationCode -passwordResetToken');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: `Account status updated to ${status}`,
      user: this.toSafeUser(user),
    };
  }

  async warn(userId: string, dto: EnforcementReasonDto, actorId?: string) {
    return this.updateStatus(
      userId,
      {
        status: AccountStatusDto.WARNED,
        reason: dto.reason,
        internalNote: dto.internalNote,
        changedBy: actorId,
      },
      actorId,
    );
  }

  async suspend(userId: string, dto: EnforcementReasonDto, actorId?: string) {
    return this.updateStatus(
      userId,
      {
        status: AccountStatusDto.SUSPENDED,
        reason: dto.reason || 'Account suspended',
        internalNote: dto.internalNote,
        suspendedUntil: dto.suspendedUntil,
        changedBy: actorId,
      },
      actorId,
    );
  }

  async disable(userId: string, dto: EnforcementReasonDto, actorId?: string) {
    return this.updateStatus(
      userId,
      {
        status: AccountStatusDto.DISABLED,
        reason: dto.reason || 'Account disabled',
        internalNote: dto.internalNote,
        changedBy: actorId,
      },
      actorId,
    );
  }

  async ban(userId: string, dto: EnforcementReasonDto, actorId?: string) {
    return this.updateStatus(
      userId,
      {
        status: AccountStatusDto.BANNED,
        reason: dto.reason || 'Account banned',
        internalNote: dto.internalNote,
        changedBy: actorId,
      },
      actorId,
    );
  }

  async restore(userId: string, dto: EnforcementReasonDto, actorId?: string) {
    return this.updateStatus(
      userId,
      {
        status: AccountStatusDto.ACTIVE,
        reason: dto.reason || 'Account restored',
        internalNote: dto.internalNote,
        changedBy: actorId,
      },
      actorId,
    );
  }

  private async findUser(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }

    const user = await this.userModel
      .findById(userId)
      .select('-password -verificationCode -passwordResetToken');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private validateStatusPayload(status: AccountStatusDto, suspendedUntil?: string) {
    if (status === AccountStatusDto.SUSPENDED && suspendedUntil) {
      const date = new Date(suspendedUntil);
      if (!Number.isFinite(date.getTime())) {
        throw new BadRequestException('Invalid suspendedUntil date');
      }
    }
  }

  private resolveActorId(actorId?: string) {
    if (!actorId || !Types.ObjectId.isValid(actorId)) {
      return undefined;
    }

    return new Types.ObjectId(actorId);
  }

  private toSafeUser(user: any) {
    const obj = typeof user.toObject === 'function' ? user.toObject() : user;

    delete obj.password;
    delete obj.verificationCode;
    delete obj.verificationCodeExpiry;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpires;

    return obj;
  }
}
