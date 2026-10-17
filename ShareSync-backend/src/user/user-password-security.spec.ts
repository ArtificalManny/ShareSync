import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';

describe('UserService password-security integration', () => {
  const currentPassword = 'OpenShare-current-test-password!';
  const newPassword = 'OpenShare-new-test-password!';

  function makeUser(
    password: string,
    extra: Record<string, unknown> = {},
  ) {
    return {
      password,
      googleId: '',
      tokenVersion: 2,
      save: jest.fn().mockResolvedValue(undefined),
      ...extra,
    };
  }

  function makeService(user: unknown) {
    // Avoid constructing real NestJS providers or database clients.
    const service = Object.create(
      UserService.prototype,
    ) as UserService;

    const exec = jest.fn().mockResolvedValue(user);
    const select = jest.fn().mockReturnValue({ exec });
    const findById = jest.fn().mockReturnValue({ select });

    // Never execute the real account-deletion operation.
    const performAccountDeletion = jest.fn()
      .mockResolvedValue(undefined);

    Object.assign(service, {
      userModel: { findById },
      performAccountDeletion,
    });

    return {
      service,
      findById,
      select,
      performAccountDeletion,
    };
  }

  describe('changePassword', () => {
    it('accepts a valid bcrypt cost-12 password', async () => {
      const hash = await bcrypt.hash(currentPassword, 12);
      const user = makeUser(hash);
      const { service, select } = makeService(user);

      await service.changePassword(
        'test-user-id',
        currentPassword,
        newPassword,
      );

      expect(select).toHaveBeenCalledWith('+password');
      expect(user.password).not.toBe(hash);
      expect(
        await bcrypt.compare(newPassword, user.password),
      ).toBe(true);
      expect(bcrypt.getRounds(user.password)).toBe(12);
      expect(user.tokenVersion).toBe(3);
      expect(user.save).toHaveBeenCalledTimes(1);
    });

    it('supports an existing bcrypt cost-10 password', async () => {
      const hash = await bcrypt.hash(currentPassword, 10);
      const user = makeUser(hash);
      const { service } = makeService(user);

      await service.changePassword(
        'test-user-id',
        currentPassword,
        newPassword,
      );

      expect(
        await bcrypt.compare(newPassword, user.password),
      ).toBe(true);
      expect(bcrypt.getRounds(user.password)).toBe(12);
      expect(user.save).toHaveBeenCalledTimes(1);
    });

    it('rejects passwords exceeding 72 UTF-8 bytes', async () => {
      const hash = await bcrypt.hash(currentPassword, 12);
      const user = makeUser(hash);
      const { service } = makeService(user);

      const oversized = String.fromCodePoint(0x1F600).repeat(19);

      await expect(
        service.changePassword(
          'test-user-id',
          currentPassword,
          oversized,
        ),
      ).rejects.toThrow(
        'New password must be between 1 and 72 UTF-8 bytes',
      );

      expect(user.password).toBe(hash);
      expect(user.tokenVersion).toBe(2);
      expect(user.save).not.toHaveBeenCalled();
    });

    it('rejects an empty replacement password', async () => {
      const hash = await bcrypt.hash(currentPassword, 12);
      const user = makeUser(hash);
      const { service } = makeService(user);

      await expect(
        service.changePassword(
          'test-user-id',
          currentPassword,
          '',
        ),
      ).rejects.toThrow(
        'New password must be between 1 and 72 UTF-8 bytes',
      );

      expect(user.password).toBe(hash);
      expect(user.tokenVersion).toBe(2);
      expect(user.save).not.toHaveBeenCalled();
    });

    it('rejects an incorrect current password', async () => {
      const hash = await bcrypt.hash(currentPassword, 10);
      const user = makeUser(hash);
      const { service } = makeService(user);

      await expect(
        service.changePassword(
          'test-user-id',
          'incorrect-password',
          newPassword,
        ),
      ).rejects.toThrow('Current password is incorrect');

      expect(user.password).toBe(hash);
      expect(user.tokenVersion).toBe(2);
      expect(user.save).not.toHaveBeenCalled();
    });

    it('rejects an existing plaintext password', async () => {
      const user = makeUser(currentPassword);
      const { service } = makeService(user);

      await expect(
        service.changePassword(
          'test-user-id',
          currentPassword,
          newPassword,
        ),
      ).rejects.toThrow('Current password is incorrect');

      expect(user.save).not.toHaveBeenCalled();
    });

    it('rejects an unknown user', async () => {
      const { service } = makeService(null);

      await expect(
        service.changePassword(
          'missing-user',
          currentPassword,
          newPassword,
        ),
      ).rejects.toThrow('User not found');
    });
  });

  describe('deleteAccount', () => {
    it('accepts the correct bcrypt password', async () => {
      const hash = await bcrypt.hash(currentPassword, 12);
      const user = makeUser(hash);

      const {
        service,
        performAccountDeletion,
      } = makeService(user);

      await service.deleteAccount(
        'test-user-id',
        currentPassword,
      );

      expect(performAccountDeletion)
        .toHaveBeenCalledTimes(1);

      expect(performAccountDeletion)
        .toHaveBeenCalledWith('test-user-id', user);
    });

    it('rejects an incorrect password', async () => {
      const hash = await bcrypt.hash(currentPassword, 10);
      const user = makeUser(hash);

      const {
        service,
        performAccountDeletion,
      } = makeService(user);

      await expect(
        service.deleteAccount(
          'test-user-id',
          'incorrect-password',
        ),
      ).rejects.toThrow('Current password is incorrect');

      expect(performAccountDeletion)
        .not.toHaveBeenCalled();
    });

    it('rejects a plaintext stored password', async () => {
      const user = makeUser(currentPassword);

      const {
        service,
        performAccountDeletion,
      } = makeService(user);

      await expect(
        service.deleteAccount(
          'test-user-id',
          currentPassword,
        ),
      ).rejects.toThrow('Current password is incorrect');

      expect(performAccountDeletion)
        .not.toHaveBeenCalled();
    });

    it('requires Google confirmation for Google-linked accounts', async () => {
      const user = makeUser('', {
        googleId: 'google-test-identity',
      });

      const {
        service,
        performAccountDeletion,
      } = makeService(user);

      await expect(
        service.deleteAccount(
          'test-user-id',
          currentPassword,
        ),
      ).rejects.toThrow();

      expect(performAccountDeletion)
        .not.toHaveBeenCalled();
    });

    it('rejects account deletion for an unknown user', async () => {
      const {
        service,
        performAccountDeletion,
      } = makeService(null);

      await expect(
        service.deleteAccount(
          'missing-user',
          currentPassword,
        ),
      ).rejects.toThrow('User not found');

      expect(performAccountDeletion)
        .not.toHaveBeenCalled();
    });
  });
});
