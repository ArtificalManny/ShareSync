import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserController } from './user.controller';
import { UserService } from './user.service';

// openshare-user-public-profile-v1 (R52)

const actorId = '507f191e810c19729de860ea';
const otherId = '507f1f77bcf86cd799439012';

const PRIVATE_FIELDS = [
  'email',
  'password',
  'googleId',
  'school',
  'job',
  'timezone',
  'searchEngineVisible',
  'accountStatus',
  'accountStatusReason',
  'accountStatusNote',
  'suspendedUntil',
  'warnings',
  'preferences',
  'notificationChannels',
  'notificationPrefs',
  'notificationPreferences',
  'emailOptOut',
  'settings',
  'projects',
  'refreshToken',
  'isEmailVerified',
  'emailVerificationToken',
  'passwordResetToken',
  'passwordResetExpires',
  'verificationCode',
  'verificationCodeExpiry',
  'tokenVersion',
  'lastLogin',
  'roles',
  'isAdmin',
  'phone',
  'phoneNumber',
  'birthday',
  'dateOfBirth',
];

function userModel(result: any = { _id: new Types.ObjectId(otherId) }) {
  const selects: string[] = [];
  const exec = jest.fn(async () => result);
  const select = jest.fn((fields: string) => {
    selects.push(fields);
    return { exec };
  });
  return {
    selects,
    model: {
      findById: jest.fn(() => ({ select, exec })),
      findOne: jest.fn(() => ({ select, exec })),
    },
  };
}

const fields = (list: string) => list.split(/\s+/).filter(Boolean).sort();

describe('R52 public profile lookup', () => {
  it('selects exactly the fields of the member profile lookup', async () => {
    const byId = userModel();
    await (UserService.prototype as any).findPublicProfileById.call({ userModel: byId.model }, otherId);
    const byUsername = userModel();
    await (UserService.prototype as any).findMemberProfileByUsername.call({ userModel: byUsername.model }, 'sam');

    expect(byId.model.findById).toHaveBeenCalledWith(otherId);
    expect(byId.selects).toHaveLength(1);
    expect(byUsername.selects).toHaveLength(1);
    expect(fields(byId.selects[0])).toEqual(fields(byUsername.selects[0]));
  });

  it('never selects account data', async () => {
    const byId = userModel();
    await (UserService.prototype as any).findPublicProfileById.call({ userModel: byId.model }, otherId);
    const selected = fields(byId.selects[0]);
    expect(selected.filter((field) => field.startsWith('-') || field.startsWith('+'))).toEqual([]);
    for (const field of PRIVATE_FIELDS) {
      expect([field, selected.includes(field)]).toEqual([field, false]);
    }
  });

  it.each([undefined, null, '', 'not-an-id', 'abcdefghijkl', ` ${otherId}`, `${otherId}0`, 12, [otherId], { $ne: null }])(
    'answers nothing for the ID %p, without a query',
    async (value) => {
      const byId = userModel();
      const result = await (UserService.prototype as any).findPublicProfileById.call({ userModel: byId.model }, value);
      expect(result).toBeNull();
      expect(byId.model.findById).not.toHaveBeenCalled();
    },
  );
});

describe('R52 GET /users/:id', () => {
  const proto = UserController.prototype as any;
  const full = { _id: new Types.ObjectId(actorId), email: 'me@example.test', settings: {} };
  const publicProfile = { _id: new Types.ObjectId(otherId), username: 'sam' };

  function controller(found: { full?: any; public?: any } = {}) {
    const users = {
      findById: jest.fn(async () => (found.full !== undefined ? found.full : full)),
      findPublicProfileById: jest.fn(async () => (found.public !== undefined ? found.public : publicProfile)),
    };
    return { users, self: { users } };
  }

  it('is the route it should be, behind JWT authentication', () => {
    expect(Reflect.getMetadata(PATH_METADATA, proto.getById)).toBe(':id');
    expect(Reflect.getMetadata(GUARDS_METADATA, proto.getById)).toEqual([JwtAuthGuard]);
  });

  it('gives you your own full record', async () => {
    for (const [user, id] of [
      [{ userId: actorId }, actorId],
      [{ sub: actorId }, actorId.toUpperCase()],
      [{ _id: new Types.ObjectId(actorId) }, actorId],
    ] as Array<[any, string]>) {
      const c = controller();
      await expect(proto.getById.call(c.self, { user }, id)).resolves.toBe(full);
      expect(c.users.findById).toHaveBeenCalledWith(id);
      expect(c.users.findPublicProfileById).not.toHaveBeenCalled();
    }
  });

  it("gives only the public profile of someone else", async () => {
    const c = controller();
    await expect(proto.getById.call(c.self, { user: { userId: actorId } }, otherId)).resolves.toBe(publicProfile);
    expect(c.users.findPublicProfileById).toHaveBeenCalledWith(otherId);
    expect(c.users.findById).not.toHaveBeenCalled();
  });

  it('never gives the full record for an ID that is not exactly yours', async () => {
    for (const id of [` ${actorId}`, `${actorId} `, `${actorId}0`, 'me', '']) {
      const c = controller({ public: null });
      await expect(proto.getById.call(c.self, { user: { userId: actorId } }, id)).rejects.toBeInstanceOf(NotFoundException);
      expect(c.users.findById).not.toHaveBeenCalled();
    }
  });

  it('never gives the full record without a usable signed-in user', async () => {
    for (const user of [undefined, null, {}, { userId: 'not-an-id' }, { sub: 12 }]) {
      const c = controller();
      await expect(proto.getById.call(c.self, { user }, actorId)).resolves.toBe(publicProfile);
      expect(c.users.findById).not.toHaveBeenCalled();
    }
    const c = controller();
    await expect(proto.getById.call(c.self, undefined, actorId)).resolves.toBe(publicProfile);
    expect(c.users.findById).not.toHaveBeenCalled();
  });

  it('answers not found when there is no such user', async () => {
    const c = controller({ full: null, public: null });
    await expect(proto.getById.call(c.self, { user: { userId: actorId } }, otherId)).rejects.toBeInstanceOf(NotFoundException);
    await expect(proto.getById.call(c.self, { user: { userId: actorId } }, actorId)).rejects.toBeInstanceOf(NotFoundException);
  });
});
