import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService password-writing standardization', () => {
  const password = 'OpenShare-New-Password-123!';
  const resetToken = 'v2e2-test-reset-token';

  function registrationDto(override?: string) {
    return {
      email: 'v2e2-user@example.com',
      username: 'v2e2-user',
      password: override === undefined ? password : override,
      firstName: 'Test',
      lastName: 'User',
    };
  }

  function registrationHarness() {
    const findOne = jest.fn().mockResolvedValue(null);
    const create = jest.fn().mockResolvedValue({
      _id: 'registered-user-id',
    });
    const findByIdAndDelete = jest.fn().mockResolvedValue(undefined);
    const sendVerificationEmail =
      jest.fn().mockResolvedValue(undefined);

    const service = Object.create(
      AuthService.prototype,
    ) as AuthService;

    Object.assign(service, {
      userModel: {
        findOne,
        create,
        findByIdAndDelete,
      },
      sendVerificationEmail,
    });

    return {
      service,
      findOne,
      create,
      findByIdAndDelete,
      sendVerificationEmail,
    };
  }

  async function resetHarness() {
    const storedToken = await bcrypt.hash(resetToken, 10);

    const user = {
      _id: 'reset-user-id',
      email: 'reset-user@example.com',
      password: 'old-password-hash',
      passwordResetToken: storedToken as string | undefined,
      passwordResetExpires: new Date(
        Date.now() + 900000,
      ) as Date | undefined,
      tokenVersion: 2,
      save: jest.fn().mockResolvedValue(undefined),
    };

    const select = jest.fn().mockResolvedValue([user]);
    const find = jest.fn().mockReturnValue({ select });

    const revokeAllRefreshSessions =
      jest.fn().mockResolvedValue(undefined);

    const service = Object.create(
      AuthService.prototype,
    ) as AuthService;

    Object.assign(service, {
      userModel: { find },
      revokeAllRefreshSessions,
    });

    return {
      service,
      user,
      find,
      select,
      revokeAllRefreshSessions,
    };
  }

  it('registers using a verifiable bcrypt cost-12 password', async () => {
    const { service, create, sendVerificationEmail } =
      registrationHarness();

    await expect(
      service.register(registrationDto()),
    ).resolves.toEqual({
      userId: 'registered-user-id',
    });

    expect(create).toHaveBeenCalledTimes(1);

    const saved = create.mock.calls[0][0];

    expect(typeof saved.password).toBe('string');
    expect(bcrypt.getRounds(saved.password)).toBe(12);
    expect(
      await bcrypt.compare(password, saved.password),
    ).toBe(true);

    expect(saved.isEmailVerified).toBe(false);
    expect(saved.tokenVersion).toBe(0);

    expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it('accepts a registration password of exactly 72 UTF-8 bytes', async () => {
    const { service, create } = registrationHarness();
    const boundary = 'é'.repeat(36);

    await service.register(registrationDto(boundary));

    const saved = create.mock.calls[0][0];

    expect(bcrypt.getRounds(saved.password)).toBe(12);
    expect(
      await bcrypt.compare(boundary, saved.password),
    ).toBe(true);
  });

  it('rejects empty registration passwords before creating an account', async () => {
    const { service, create, sendVerificationEmail } =
      registrationHarness();

    await expect(
      service.register(registrationDto('')),
    ).rejects.toThrow(
      'Password must be between 1 and 72 UTF-8 bytes',
    );

    expect(create).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('rejects oversized multibyte registration passwords', async () => {
    const { service, create, sendVerificationEmail } =
      registrationHarness();

    const oversized = String.fromCodePoint(0x1f600).repeat(19);

    await expect(
      service.register(registrationDto(oversized)),
    ).rejects.toThrow(
      'Password must be between 1 and 72 UTF-8 bytes',
    );

    expect(create).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('continues rejecting duplicate registrations', async () => {
    const { service, findOne, create } =
      registrationHarness();

    findOne.mockResolvedValue({
      email: 'v2e2-user@example.com',
    });

    await expect(
      service.register(registrationDto()),
    ).rejects.toThrow('Email already registered');

    expect(create).not.toHaveBeenCalled();
  });

  it('preserves registration cleanup when sending email fails', async () => {
    const {
      service,
      create,
      findByIdAndDelete,
      sendVerificationEmail,
    } = registrationHarness();

    sendVerificationEmail.mockRejectedValue(
      new Error('simulated delivery failure'),
    );

    const errorLog = jest.spyOn(
      console,
      'error',
    ).mockImplementation(() => undefined);

    try {
      await expect(
        service.register(registrationDto()),
      ).rejects.toThrow(
        'Could not send verification email',
      );

      expect(create).toHaveBeenCalledTimes(1);
      expect(findByIdAndDelete).toHaveBeenCalledWith(
        'registered-user-id',
      );
    } finally {
      errorLog.mockRestore();
    }
  });

  it('resets passwords with bcrypt cost 12 and revokes sessions', async () => {
    const {
      service,
      user,
      select,
      revokeAllRefreshSessions,
    } = await resetHarness();

    await service.resetPassword(resetToken, password);

    expect(select).toHaveBeenCalledWith(
      '+passwordResetToken',
    );

    expect(bcrypt.getRounds(user.password)).toBe(12);
    expect(
      await bcrypt.compare(password, user.password),
    ).toBe(true);

    expect(user.passwordResetToken).toBeUndefined();
    expect(user.passwordResetExpires).toBeUndefined();
    expect(user.tokenVersion).toBe(3);
    expect(user.save).toHaveBeenCalledTimes(1);

    expect(revokeAllRefreshSessions).toHaveBeenCalledWith(
      'reset-user-id',
    );
  });

  it('accepts a reset password of exactly 72 UTF-8 bytes', async () => {
    const { service, user } = await resetHarness();
    const boundary = 'é'.repeat(36);

    await service.resetPassword(resetToken, boundary);

    expect(bcrypt.getRounds(user.password)).toBe(12);
    expect(
      await bcrypt.compare(boundary, user.password),
    ).toBe(true);
  });

  it('does not consume a reset token for an empty password', async () => {
    const {
      service,
      user,
      revokeAllRefreshSessions,
    } = await resetHarness();

    const previousToken = user.passwordResetToken;
    const previousExpiry = user.passwordResetExpires;

    await expect(
      service.resetPassword(resetToken, ''),
    ).rejects.toThrow(
      'New password must be between 1 and 72 UTF-8 bytes',
    );

    expect(user.password).toBe('old-password-hash');
    expect(user.passwordResetToken).toBe(previousToken);
    expect(user.passwordResetExpires).toBe(previousExpiry);
    expect(user.tokenVersion).toBe(2);
    expect(user.save).not.toHaveBeenCalled();
    expect(revokeAllRefreshSessions).not.toHaveBeenCalled();
  });

  it('does not consume a reset token for an oversized password', async () => {
    const {
      service,
      user,
      revokeAllRefreshSessions,
    } = await resetHarness();

    const previousToken = user.passwordResetToken;
    const oversized = String.fromCodePoint(0x1f600).repeat(19);

    await expect(
      service.resetPassword(resetToken, oversized),
    ).rejects.toThrow(
      'New password must be between 1 and 72 UTF-8 bytes',
    );

    expect(user.password).toBe('old-password-hash');
    expect(user.passwordResetToken).toBe(previousToken);
    expect(user.tokenVersion).toBe(2);
    expect(user.save).not.toHaveBeenCalled();
    expect(revokeAllRefreshSessions).not.toHaveBeenCalled();
  });

  it('rejects an invalid reset token without changing credentials', async () => {
    const {
      service,
      user,
      revokeAllRefreshSessions,
    } = await resetHarness();

    await expect(
      service.resetPassword('incorrect-reset-token', password),
    ).rejects.toThrow('Invalid or expired reset token');

    expect(user.password).toBe('old-password-hash');
    expect(user.tokenVersion).toBe(2);
    expect(user.save).not.toHaveBeenCalled();
    expect(revokeAllRefreshSessions).not.toHaveBeenCalled();
  });
});
