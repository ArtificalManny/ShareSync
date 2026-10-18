import { readFileSync } from 'fs';
import { join } from 'path';
import { AuthService } from './auth.service';

describe('V2F1-R2A authentication log privacy', () => {
  const email = 'r2a-private@example.invalid';
  const username = 'r2a-private-username';
  const secret = 'R2A-PRIVATE-ERROR-DETAIL';

  function serviceWith(properties: Record<string, unknown>) {
    const service = Object.create(
      AuthService.prototype,
    ) as AuthService;

    Object.assign(service, properties);
    return service;
  }

  function capture() {
    const log = jest.spyOn(
      console, 'log',
    ).mockImplementation(() => undefined);

    const info = jest.spyOn(
      console, 'info',
    ).mockImplementation(() => undefined);

    const error = jest.spyOn(
      console, 'error',
    ).mockImplementation(() => undefined);

    return {
      output: () => JSON.stringify([
        ...log.mock.calls,
        ...info.mock.calls,
        ...error.mock.calls,
      ]),
      restore: () => {
        log.mockRestore();
        info.mockRestore();
        error.mockRestore();
      },
    };
  }

  it('registers without logging email or username', async () => {
    const create = jest.fn().mockResolvedValue({
      _id: 'r2a-user',
    });

    const service = serviceWith({
      userModel: {
        findOne: jest.fn().mockResolvedValue(null),
        create,
      },
      sendVerificationEmail:
        jest.fn().mockResolvedValue(undefined),
    });

    const spy = capture();

    try {
      await expect(service.register({
        email,
        username,
        password: 'Valid-Registration-Password!',
        firstName: 'Test',
        lastName: 'User',
      })).resolves.toEqual({ userId: 'r2a-user' });

      expect(create).toHaveBeenCalledTimes(1);
      expect(spy.output()).not.toContain(email);
      expect(spy.output()).not.toContain(username);
    } finally {
      spy.restore();
    }
  });

  it('preserves cleanup without logging raw delivery errors', async () => {
    const findByIdAndDelete = jest.fn()
      .mockResolvedValue(undefined);

    const service = serviceWith({
      userModel: {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          _id: 'r2a-created-user',
        }),
        findByIdAndDelete,
      },
      sendVerificationEmail: jest.fn()
        .mockRejectedValue(new Error(secret)),
    });

    const spy = capture();

    try {
      await expect(service.register({
        email,
        username,
        password: 'Valid-Registration-Password!',
        firstName: 'Test',
        lastName: 'User',
      })).rejects.toThrow(
        'Could not send verification email',
      );

      expect(findByIdAndDelete).toHaveBeenCalledWith(
        'r2a-created-user',
      );

      expect(spy.output()).not.toContain(secret);
      expect(spy.output()).not.toContain(email);
    } finally {
      spy.restore();
    }
  });

  it('keeps unknown-email recovery silent in logs', async () => {
    const findOne = jest.fn().mockResolvedValue(null);

    const service = serviceWith({
      userModel: { findOne },
    });

    const spy = capture();

    try {
      await expect(
        service.forgotPassword(email),
      ).resolves.toBeUndefined();

      expect(findOne).toHaveBeenCalled();
      expect(spy.output()).not.toContain(email);
      expect(spy.output()).not.toContain('User not found');
    } finally {
      spy.restore();
    }
  });

  it('does not log raw password-reset delivery errors', async () => {
    const user = {
      _id: 'r2a-user',
      email,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
      save: jest.fn().mockResolvedValue(undefined),
    };

    const service = serviceWith({
      userModel: {
        findOne: jest.fn().mockResolvedValue(user),
      },
      sendPasswordResetEmail: jest.fn()
        .mockRejectedValue(new Error(secret)),
    });

    const spy = capture();

    try {
      await expect(
        service.forgotPassword(email),
      ).resolves.toBeUndefined();

      expect(user.save).toHaveBeenCalledTimes(1);
      expect(user.passwordResetToken).toBeTruthy();
      expect(spy.output()).not.toContain(secret);
      expect(spy.output()).not.toContain(email);
    } finally {
      spy.restore();
    }
  });

  it('does not log identity during Google-linked lookup', async () => {
    const user = {
      _id: 'google-linked-user',
      email,
      password: 'mock-stored-hash',
      googleId: 'google-test-id',
    };

    const service = serviceWith({
      userModel: {
        findOne: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(user),
        }),
      },
      enforceAccountAllowed: jest.fn(),
    });

    const spy = capture();

    try {
      const result =
        await service.validateOrCreateGoogleUser({
          googleId: 'google-test-id',
          email,
          firstName: 'Test',
          lastName: 'User',
          profilePicture: '',
        });

      expect(result.email).toBe(email);
      expect(result).not.toHaveProperty('password');
      expect(spy.output()).not.toContain(email);
    } finally {
      spy.restore();
    }
  });

  it('does not log raw Resend provider responses', async () => {
    const originalKey = process.env.RESEND_API_KEY;
    const originalFrom = process.env.RESEND_FROM;

    process.env.RESEND_API_KEY = 'r2a-fake-key';
    process.env.RESEND_FROM = 'test@example.invalid';

    const fetchMock = jest.spyOn(
      globalThis, 'fetch',
    ).mockResolvedValue({
      ok: false,
      status: 400,
      text: jest.fn().mockResolvedValue(secret),
    } as any);

    const service = serviceWith({});
    const spy = capture();

    try {
      await expect(
        (service as any).sendVerificationEmail(
          email,
          '123456',
          new Date(Date.now() + 900000),
        ),
      ).rejects.toThrow('Resend API failed');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(spy.output()).not.toContain(secret);
      expect(spy.output()).not.toContain(email);
    } finally {
      spy.restore();
      fetchMock.mockRestore();

      if (originalKey === undefined) {
        delete process.env.RESEND_API_KEY;
      } else {
        process.env.RESEND_API_KEY = originalKey;
      }

      if (originalFrom === undefined) {
        delete process.env.RESEND_FROM;
      } else {
        process.env.RESEND_FROM = originalFrom;
      }
    }
  });

  it('contains no identified raw-error or identity log expressions', () => {
    const source = readFileSync(
      join(__dirname, 'auth.service.ts'),
      'utf8',
    );

    const forbidden = [
      "console.log('🔵 email:', dto.email",
      "console.log('🔵 email:', email)",
      "console.log('🟢 PASSWORD RESET SUCCESSFUL for', targetUser.email)",
      "console.log('🔵 GOOGLE AUTH: validateOrCreateGoogleUser for', profile.email)",
      "console.log('🟢 GOOGLE AUTH: Existing Google-linked user found:', user.email)",
      "console.log('🟢 GOOGLE AUTH: New user created:', newUser.email",
      "console.log('🟢 Verification email sent via Resend to', to)",
      "console.log('🟢 Verification email sent via SMTP to', to)",
      "message: error?.message,",
      "response: error?.response,",
    ];

    for (const expression of forbidden) {
      expect(source).not.toContain(expression);
    }

    expect(source).toContain(
      "console.error('Registration verification email failed')",
    );

    expect(source).toContain(
      "console.error('Resend password-reset transport failed')",
    );
  });
});
