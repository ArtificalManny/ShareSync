import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Types } from 'mongoose';
import { AnalyticsController } from '../../analytics/analytics.controller';
import { GrowthController } from '../../analytics/growth.controller';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { SELF_ONLY_REFUSAL, SelfOnlyGuard } from './self-only.guard';

// openshare-self-only-v1 (R52)

const actorId = '507f191e810c19729de860ea';
const otherId = '507f1f77bcf86cd799439012';

function decide(user: any, params: any): string {
  const guard = new SelfOnlyGuard();
  const context: any = { switchToHttp: () => ({ getRequest: () => ({ user, params }) }) };
  try {
    return guard.canActivate(context) ? 'allowed' : 'refused';
  } catch (error: any) {
    return error?.constructor?.name ?? 'error';
  }
}

function routes(controller: any): string[] {
  const proto = controller.prototype;
  return Object.getOwnPropertyNames(proto).filter(
    (name) => name !== 'constructor' && typeof proto[name] === 'function' && Reflect.getMetadata(PATH_METADATA, proto[name]) !== undefined,
  );
}

describe('R52 self-only routes', () => {
  it('guards the whole growth controller after JWT authentication', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, GrowthController)).toEqual([JwtAuthGuard, SelfOnlyGuard]);
  });

  it('has only routes about the person in the address on the growth controller', () => {
    const proto = GrowthController.prototype as any;
    const names = routes(GrowthController).sort();
    expect(names).toEqual(['getEvolution', 'getSkillProfile', 'getSuggestions', 'getTrends']);
    for (const name of names) {
      expect([name, Reflect.getMetadata(PATH_METADATA, proto[name])]).toEqual([name, expect.stringMatching(/^:userId\//)]);
      expect(Reflect.getMetadata(GUARDS_METADATA, proto[name])).toBeUndefined();
    }
  });

  it("guards another person's productivity on the analytics controller", () => {
    const proto = AnalyticsController.prototype as any;
    expect(Reflect.getMetadata(GUARDS_METADATA, AnalyticsController)).toEqual([JwtAuthGuard]);
    expect(Reflect.getMetadata(PATH_METADATA, proto.getSpecificUserProductivity)).toBe('user/:userId/productivity');
    expect(Reflect.getMetadata(GUARDS_METADATA, proto.getSpecificUserProductivity)).toEqual([SelfOnlyGuard]);
  });

  it('answers you about yourself', () => {
    expect(decide({ userId: actorId }, { userId: actorId })).toBe('allowed');
    expect(decide({ sub: actorId }, { userId: actorId.toUpperCase() })).toBe('allowed');
    expect(decide({ _id: new Types.ObjectId(actorId) }, { userId: actorId })).toBe('allowed');
    expect(decide({ id: actorId.toUpperCase() }, { userId: actorId })).toBe('allowed');
  });

  it('refuses anyone asking about someone else, with a plain message', () => {
    expect(decide({ userId: actorId }, { userId: otherId })).toBe('ForbiddenException');
    const guard = new SelfOnlyGuard();
    const context: any = { switchToHttp: () => ({ getRequest: () => ({ user: { userId: actorId }, params: { userId: otherId } }) }) };
    expect(() => guard.canActivate(context)).toThrow(new ForbiddenException(SELF_ONLY_REFUSAL));
  });

  it.each([undefined, null, '', 'me', 'not-an-id', ` ${actorId}`, `${actorId} `, `${actorId}0`, 12, [actorId], { $ne: null }])(
    'refuses the address ID %p, even for its own user',
    (value) => {
      expect(decide({ userId: actorId }, { userId: value })).toBe('ForbiddenException');
    },
  );

  it('refuses without a usable signed-in user', () => {
    for (const user of [undefined, null, {}, { userId: null }, { userId: '' }, { userId: 'not-an-id' }, { sub: 12 }, { id: [actorId] }]) {
      expect(decide(user, { userId: actorId })).toBe('ForbiddenException');
    }
  });

  it('refuses a request without route parameters', () => {
    expect(decide({ userId: actorId }, undefined)).toBe('ForbiddenException');
    expect(decide({ userId: actorId }, {})).toBe('ForbiddenException');
  });
});
