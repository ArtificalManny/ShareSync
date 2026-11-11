import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { AdminGuard } from '../account-enforcement/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContentReportsController } from './content-reports.controller';

// openshare-content-reports-admin-only-v1 (R52)

const ADMIN_ROUTES = ['getAdminQueue', 'getAdminStats', 'getReportById', 'resolveReport', 'getReportsAgainstUser'];
const USER_ROUTES = ['createReport', 'getMyReports'];

const proto = ContentReportsController.prototype as any;

function decide(user: any): string {
  const context: any = { switchToHttp: () => ({ getRequest: () => ({ user }) }) };
  try {
    return new AdminGuard().canActivate(context) ? 'allowed' : 'refused';
  } catch (error: any) {
    return error?.constructor?.name ?? 'error';
  }
}

describe('R52 content report moderation is for admins', () => {
  it('knows every route of the controller, so a new one has to be placed here', () => {
    const names = Object.getOwnPropertyNames(proto).filter(
      (name) => name !== 'constructor' && typeof proto[name] === 'function' && Reflect.getMetadata(PATH_METADATA, proto[name]) !== undefined,
    );
    expect(names.sort()).toEqual([...ADMIN_ROUTES, ...USER_ROUTES].sort());
  });

  it('signs everyone in first, on the whole controller', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, ContentReportsController)).toEqual([JwtAuthGuard]);
  });

  it.each(ADMIN_ROUTES)('needs an admin for %s', (name) => {
    expect(String(Reflect.getMetadata(PATH_METADATA, proto[name]))).toMatch(/^admin\//);
    expect(Reflect.getMetadata(GUARDS_METADATA, proto[name])).toEqual([AdminGuard]);
  });

  it.each(USER_ROUTES)('leaves %s to anyone signed in', (name) => {
    expect(String(Reflect.getMetadata(PATH_METADATA, proto[name]))).not.toMatch(/^admin/);
    expect(Reflect.getMetadata(GUARDS_METADATA, proto[name])).toBeUndefined();
  });

  it('lets admins and founders in', () => {
    expect(decide({ isAdmin: true })).toBe('allowed');
    expect(decide({ role: 'Admin' })).toBe('allowed');
    expect(decide({ roles: ['user', 'ADMIN'] })).toBe('allowed');
    expect(decide({ roles: ['founder'] })).toBe('allowed');
  });

  it('refuses everyone else', () => {
    for (const user of [undefined, null, {}, { roles: [] }, { roles: ['user'] }, { roles: 'admin' }, { isAdmin: 'true' }, { role: 'member' }]) {
      expect(decide(user)).toBe('ForbiddenException');
    }
    const context: any = { switchToHttp: () => ({ getRequest: () => ({ user: { roles: ['user'] } }) }) };
    expect(() => new AdminGuard().canActivate(context)).toThrow(ForbiddenException);
  });
});
