import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JwtService } from '@nestjs/jwt';
import { WsJwtGuard } from './ws-jwt.guard';
import { validateWsSession } from './ws-session.validator';

jest.mock('./ws-session.validator', () => ({
  validateWsSession: jest.fn(),
}));

describe('V2G1-R2B2 WebSocket JWT hardening', () => {
  const secret = randomBytes(48).toString('base64url');
  const otherSecret = randomBytes(48).toString('base64url');
  const jwt = new JwtService({});
  const connection = {} as any;

  const validator = validateWsSession as
    jest.MockedFunction<typeof validateWsSession>;

  const guardSource = readFileSync(
    join(__dirname, 'ws-jwt.guard.ts'), 'utf8',
  );

  const moduleSource = readFileSync(
    join(__dirname, '../realtime/realtime.module.ts'), 'utf8',
  );

  let previousSecret: string | undefined;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = secret;

    validator.mockReset();
    validator.mockResolvedValue({
      userId: '507f1f77bcf86cd799439011',
      user: {
        email: 'current@example.invalid',
        username: 'current-user',
        roles: ['member'],
      },
    } as any);

    errorSpy = jest.spyOn(
      console, 'error',
    ).mockImplementation(() => {});
  });

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousSecret;
    }
    errorSpy.mockRestore();
  });

  function makeGuard(): WsJwtGuard {
    const guard = Object.create(
      WsJwtGuard.prototype,
    ) as WsJwtGuard;

    Object.assign(guard, {
      // The explicit validated secret must override this
      // deliberately different configured service secret.
      jwtService: new JwtService({ secret: otherSecret }),
      connection,
    });

    return guard;
  }

  function clientWithToken(
    token: string | undefined,
    location: 'auth' | 'query' | 'header' = 'auth',
  ): any {
    const client: any = {
      handshake: {
        auth: {},
        query: {},
        headers: {},
      },
    };

    if (token !== undefined) {
      if (location === 'auth') {
        client.handshake.auth.token = token;
      } else if (location === 'query') {
        client.handshake.query.token = token;
      } else {
        client.handshake.headers.authorization =
          `Bearer ${token}`;
      }
    }

    return client;
  }

  function context(client: any): any {
    return {
      switchToWs: () => ({
        getClient: () => client,
      }),
    };
  }

  async function token(
    options: Record<string, any> = {},
  ): Promise<string> {
    return jwt.signAsync(
      {
        sub: '507f1f77bcf86cd799439011',
        email: 'stale@example.invalid',
        username: 'stale-user',
        roles: ['old-role'],
      },
      {
        secret,
        expiresIn: '7d',
        ...options,
      },
    );
  }

  it('validates the explicit authentication guard secret', () => {
    expect(guardSource).toContain(
      'secret: requireValidatedJwtSecret(process.env.JWT_SECRET),',
    );
    expect(guardSource).not.toContain(
      "process.env.JWT_SECRET || 'dev_secret_change_me'",
    );
  });

  it('uses asynchronous validated realtime JWT registration', () => {
    expect(moduleSource).toContain('JwtModule.registerAsync({');
    expect(moduleSource).toContain('inject: [ConfigService]');
    expect(moduleSource).toContain(
      "requireValidatedJwtSecret(config.get<string>('JWT_SECRET'))",
    );
    expect(moduleSource).not.toContain('dev_secret_change_me');
  });

  it('preserves the realtime seven-day default expiration', () => {
    expect(moduleSource).toContain(
      "config.get<string>('JWT_EXPIRES_IN', '7d')",
    );
  });

  it('verifies a valid access token and uses live session identity', async () => {
    const client = clientWithToken(await token());

    await expect(
      makeGuard().canActivate(context(client)),
    ).resolves.toBe(true);

    expect(validator).toHaveBeenCalledWith(
      connection,
      expect.objectContaining({
        sub: '507f1f77bcf86cd799439011',
      }),
    );

    expect(client.user).toMatchObject({
      id: '507f1f77bcf86cd799439011',
      email: 'current@example.invalid',
      username: 'current-user',
      roles: ['member'],
    });
  });

  it('accepts the existing Bearer authorization transport', async () => {
    const client = clientWithToken(await token(), 'header');
    await expect(
      makeGuard().canActivate(context(client)),
    ).resolves.toBe(true);
  });

  it('accepts the existing Socket.IO query transport', async () => {
    const client = clientWithToken(await token(), 'query');
    await expect(
      makeGuard().canActivate(context(client)),
    ).resolves.toBe(true);
  });

  it('rejects an incorrectly signed JWT', async () => {
    const invalid = await token({ secret: otherSecret });

    await expect(
      makeGuard().canActivate(context(clientWithToken(invalid))),
    ).rejects.toThrow('Authentication failed');

    expect(validator).not.toHaveBeenCalled();
  });

  it('rejects an expired JWT', async () => {
    const expired = await token({ expiresIn: -1 });

    await expect(
      makeGuard().canActivate(context(clientWithToken(expired))),
    ).rejects.toThrow('Authentication failed');

    expect(validator).not.toHaveBeenCalled();
  });

  it('fails closed when JWT_SECRET is missing', async () => {
    delete process.env.JWT_SECRET;

    await expect(
      makeGuard().canActivate(
        context(clientWithToken(await token())),
      ),
    ).rejects.toThrow('Authentication failed');

    expect(validator).not.toHaveBeenCalled();
  });

  it('rejects the unsafe development secret', async () => {
    const signed = await token();
    process.env.JWT_SECRET = 'dev_secret_change_me';

    await expect(
      makeGuard().canActivate(context(clientWithToken(signed))),
    ).rejects.toThrow('Authentication failed');

    expect(validator).not.toHaveBeenCalled();
  });

  it('rejects missing handshake credentials', async () => {
    await expect(
      makeGuard().canActivate(
        context(clientWithToken(undefined)),
      ),
    ).rejects.toThrow('Authentication failed');

    expect(validator).not.toHaveBeenCalled();
  });

  it('rejects invalidated sessions without leaking details', async () => {
    const sensitive = `private-session-${secret}`;
    validator.mockRejectedValueOnce(new Error(sensitive));

    const signed = await token();

    await expect(
      makeGuard().canActivate(
        context(clientWithToken(signed)),
      ),
    ).rejects.toThrow('Authentication failed');

    const logged = errorSpy.mock.calls.flat().join(' ');

    expect(logged).not.toContain(sensitive);
    expect(logged).not.toContain(signed);
    expect(logged).not.toContain(secret);
  });
});
