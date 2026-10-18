import { readFileSync } from 'fs';
import { join } from 'path';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { WsJwtGuard } from './ws-jwt.guard';

describe('V2F1-R2B authentication exception privacy', () => {
  const secret = 'R2B-PRIVATE-EXCEPTION-DETAIL';
  const email = 'r2b-private@example.invalid';
  const token = 'R2B-PRIVATE-ACCESS-TOKEN';

  function makeController(
    properties: Record<string, unknown> = {},
  ) {
    const controller = Object.create(
      AuthController.prototype,
    ) as AuthController;

    Object.assign(controller, properties);
    return controller;
  }

  function makeStrategy(
    properties: Record<string, unknown>,
  ) {
    const strategy = Object.create(
      GoogleStrategy.prototype,
    ) as GoogleStrategy;

    Object.assign(strategy, properties);
    return strategy;
  }

  function makeGuard(
    properties: Record<string, unknown> = {},
  ) {
    const guard = Object.create(
      WsJwtGuard.prototype,
    ) as WsJwtGuard;

    Object.assign(guard, properties);
    return guard;
  }

  function capture() {
    const calls: unknown[][] = [];

    const log = jest.spyOn(
      console, 'log',
    ).mockImplementation((...args: unknown[]) => {
      calls.push(args);
    });

    const error = jest.spyOn(
      console, 'error',
    ).mockImplementation((...args: unknown[]) => {
      calls.push(args);
    });

    return {
      output: () => JSON.stringify(calls),
      restore: () => {
        log.mockRestore();
        error.mockRestore();
      },
    };
  }

  function googleProfile() {
    return {
      id: 'r2b-google-id',
      name: {
        givenName: 'Test',
        familyName: 'User',
      },
      emails: [{ value: email }],
      photos: [],
    };
  }

  it('returns a generic Google callback error without leaking exceptions', async () => {
    const controller = makeController({
      jwtService: {
        signAsync: jest.fn().mockRejectedValue(
          new Error(secret),
        ),
      },
    });

    const res = {
      redirect: jest.fn((url: string) => url),
    };

    const spy = capture();

    try {
      const redirect = await controller.googleCallback(
        {
          user: {
            _id: 'r2b-user-id',
            email,
          },
        },
        res,
      );

      expect(redirect).toContain(
        '/auth/google/callback?error=Authentication+failed',
      );
      expect(redirect).not.toContain(secret);
      expect(redirect).not.toContain(email);
      expect(spy.output()).not.toContain(secret);
      expect(spy.output()).not.toContain(email);
    } finally {
      spy.restore();
    }
  });

  it('preserves the no-user Google callback error route', async () => {
    const controller = makeController();

    const res = {
      redirect: jest.fn((url: string) => url),
    };

    const spy = capture();

    try {
      const redirect = await controller.googleCallback(
        { user: null },
        res,
      );

      expect(redirect).toContain(
        '?error=Authentication+failed',
      );
      expect(res.redirect).toHaveBeenCalledTimes(1);
    } finally {
      spy.restore();
    }
  });

  it('preserves successful Google session redirects', async () => {
    const refresh = 'R2B-PRIVATE-REFRESH-TOKEN';

    const signAsync = jest.fn()
      .mockResolvedValue(token);

    const createRefreshSession = jest.fn()
      .mockResolvedValue(refresh);

    const controller = makeController({
      jwtService: { signAsync },
      authService: { createRefreshSession },
    });

    const res = {
      redirect: jest.fn((url: string) => url),
    };

    const spy = capture();

    try {
      const redirect = await controller.googleCallback(
        {
          user: {
            _id: 'r2b-user-id',
            email,
            username: 'r2b-user',
            firstName: 'Test',
            lastName: 'User',
            tokenVersion: 0,
          },
        },
        res,
      );

      expect(redirect).toContain(
        '/auth/google/callback#',
      );

      const url = new URL(redirect);
      const params = new URLSearchParams(
        url.hash.slice(1),
      );

      expect(url.search).toBe('');
      expect(params.get('access_token')).toBe(token);
      expect(params.get('refresh_token')).toBe(refresh);

      expect(
        JSON.parse(params.get('user') || '{}').email,
      ).toBe(email);

      expect(signAsync).toHaveBeenCalledTimes(1);
      expect(createRefreshSession).toHaveBeenCalledWith(
        'r2b-user-id',
      );

      expect(spy.output()).not.toContain(token);
      expect(spy.output()).not.toContain(refresh);
    } finally {
      spy.restore();
    }
  });

  it('validates Google profiles without logging account identity', async () => {
    const user = {
      _id: 'r2b-google-user',
      email,
    };

    const validateOrCreateGoogleUser = jest.fn()
      .mockResolvedValue(user);

    const strategy = makeStrategy({
      authService: {
        validateOrCreateGoogleUser,
      },
    });

    const done = jest.fn();
    const spy = capture();

    try {
      await strategy.validate(
        'fake-access-token',
        'fake-refresh-token',
        googleProfile(),
        done,
      );

      expect(done).toHaveBeenCalledWith(null, user);
      expect(validateOrCreateGoogleUser)
        .toHaveBeenCalledTimes(1);
      expect(spy.output()).not.toContain(email);
    } finally {
      spy.restore();
    }
  });

  it('preserves Google strategy failure propagation without logging error details', async () => {
    const failure = new Error(secret);

    const strategy = makeStrategy({
      authService: {
        validateOrCreateGoogleUser: jest.fn()
          .mockRejectedValue(failure),
      },
    });

    const done = jest.fn();
    const spy = capture();

    try {
      await strategy.validate(
        'fake-access-token',
        'fake-refresh-token',
        googleProfile(),
        done,
      );

      expect(done).toHaveBeenCalledWith(
        failure,
        null,
      );

      expect(spy.output()).not.toContain(secret);
      expect(spy.output()).not.toContain(email);
    } finally {
      spy.restore();
    }
  });

  it('rejects invalid WebSocket JWTs without logging secrets', async () => {
    const verifyAsync = jest.fn()
      .mockRejectedValue(new Error(secret));

    const guard = makeGuard({
      jwtService: { verifyAsync },
    });

    const context = {
      switchToWs: () => ({
        getClient: () => ({
          handshake: {
            auth: { token },
          },
        }),
      }),
    };

    const spy = capture();

    try {
      await expect(
        guard.canActivate(context as any),
      ).rejects.toThrow('Authentication failed');

      expect(verifyAsync).toHaveBeenCalledTimes(1);
      expect(spy.output()).not.toContain(secret);
      expect(spy.output()).not.toContain(token);
    } finally {
      spy.restore();
    }
  });

  it('returns null on WebSocket token extraction failures without logging details', () => {
    const guard = makeGuard();

    const client = {
      handshake: {
        get auth() {
          throw new Error(secret);
        },
      },
    };

    const spy = capture();

    try {
      const extracted = (guard as any).extractToken(
        client,
      );

      expect(extracted).toBeNull();
      expect(spy.output()).not.toContain(secret);
    } finally {
      spy.restore();
    }
  });

  it('contains no identified raw Google or WebSocket error logs', () => {
    const controller = readFileSync(
      join(__dirname, 'auth.controller.ts'),
      'utf8',
    );

    const strategy = readFileSync(
      join(__dirname, 'strategies/google.strategy.ts'),
      'utf8',
    );

    const guard = readFileSync(
      join(__dirname, 'ws-jwt.guard.ts'),
      'utf8',
    );

    expect(controller).toContain(
      "console.error('Google account deletion failed')",
    );

    expect(controller).toContain(
      "console.error('Google callback failed')",
    );

    expect(controller).not.toContain(
      'encodeURIComponent(err.message)',
    );

    expect(strategy).toContain(
      "console.error('Google strategy validation failed')",
    );

    expect(strategy).not.toContain(
      "console.error('❌ GOOGLE STRATEGY: Validation failed:', err.message)",
    );

    expect(guard).toContain(
      "console.error('WebSocket authentication failed')",
    );

    expect(guard).toContain(
      "console.error('WebSocket token extraction failed')",
    );

    expect(guard).not.toContain(
      "console.error('WebSocket auth failed:', error)",
    );

    expect(guard).not.toContain(
      "console.error('Failed to extract token:', error)",
    );
  });
});
