import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

describe('V2F1 authentication logging safety', () => {
  const code = 'V2F1-PRIVATE-OTP-929199';
  const email = 'v2f1-private@example.com';
  const resetUrl =
    'https://example.invalid/reset-password/V2F1-PRIVATE-RESET-TOKEN';

  async function withDevelopmentFallback(
    action: () => Promise<void>,
  ): Promise<void> {
    const keys = [
      'NODE_ENV',
      'RESEND_API_KEY',
      'RESEND_FROM',
    ] as const;

    const originals = keys.map(
      (key) => [key, process.env[key]] as const,
    );

    process.env.NODE_ENV = 'test';
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;

    try {
      await action();
    } finally {
      for (const [key, value] of originals) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    }
  }

  it('does not log the submitted verification code or user ID', async () => {
    const service = Object.create(
      AuthService.prototype,
    ) as AuthService;

    const select = jest.fn().mockResolvedValue(null);
    const findById = jest.fn().mockReturnValue({ select });

    Object.assign(service, {
      userModel: { findById },
    });

    const log = jest.spyOn(
      console,
      'log',
    ).mockImplementation(() => undefined);

    try {
      await expect(
        service.verifyEmail('V2F1-PRIVATE-USER-ID', code),
      ).rejects.toThrow('Invalid user');

      const output = JSON.stringify(log.mock.calls);

      expect(output).not.toContain(code);
      expect(output).not.toContain(
        'V2F1-PRIVATE-USER-ID',
      );
    } finally {
      log.mockRestore();
    }
  });

  it('never logs partial login session credentials', async () => {
    const controller = Object.create(
      AuthController.prototype,
    ) as AuthController;

    const accessToken = 'V2F1-PRIVATE-ACCESS-TOKEN';

    Object.assign(controller, {
      authService: {
        login: jest.fn().mockResolvedValue({
          access_token: accessToken,
          refresh_token: undefined,
          user: { id: 'test-user' },
        }),
      },
    });

    const log = jest.spyOn(
      console,
      'log',
    ).mockImplementation(() => undefined);

    const error = jest.spyOn(
      console,
      'error',
    ).mockImplementation(() => undefined);

    try {
      await expect(
        controller.login({
          email,
          password: 'test-password',
        }),
      ).rejects.toThrow('Invalid login response format');

      const output = JSON.stringify(error.mock.calls);

      expect(output).not.toContain(accessToken);
      expect(output).not.toContain(email);
    } finally {
      log.mockRestore();
      error.mockRestore();
    }
  });

  it('does not print verification secrets in the development mail fallback', async () => {
    const service = Object.create(
      AuthService.prototype,
    ) as AuthService;

    Object.assign(service, {
      isSmtpConfigured: jest.fn().mockReturnValue(false),
    });

    const log = jest.spyOn(
      console,
      'log',
    ).mockImplementation(() => undefined);

    const info = jest.spyOn(
      console,
      'info',
    ).mockImplementation(() => undefined);

    try {
      await withDevelopmentFallback(async () => {
        await (service as any).sendVerificationEmail(
          email,
          code,
          new Date(Date.now() + 900000),
        );
      });

      const output = JSON.stringify([
        ...log.mock.calls,
        ...info.mock.calls,
      ]);

      expect(output).not.toContain(code);
      expect(output).not.toContain(email);
    } finally {
      log.mockRestore();
      info.mockRestore();
    }
  });

  it('does not print reset URLs in the development mail fallback', async () => {
    const service = Object.create(
      AuthService.prototype,
    ) as AuthService;

    Object.assign(service, {
      isSmtpConfigured: jest.fn().mockReturnValue(false),
    });

    const log = jest.spyOn(
      console,
      'log',
    ).mockImplementation(() => undefined);

    const info = jest.spyOn(
      console,
      'info',
    ).mockImplementation(() => undefined);

    try {
      await withDevelopmentFallback(async () => {
        await (service as any).sendPasswordResetEmail(
          email,
          resetUrl,
          new Date(Date.now() + 900000),
        );
      });

      const output = JSON.stringify([
        ...log.mock.calls,
        ...info.mock.calls,
      ]);

      expect(output).not.toContain(resetUrl);
      expect(output).not.toContain(email);
      expect(output).not.toContain(
        'V2F1-PRIVATE-RESET-TOKEN',
      );
    } finally {
      log.mockRestore();
      info.mockRestore();
    }
  });
});
