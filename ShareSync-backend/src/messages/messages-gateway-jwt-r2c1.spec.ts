import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JwtService } from '@nestjs/jwt';
import { MessagesGateway } from './messages.gateway';
import { validateWsSession } from '../auth/ws-session.validator';

jest.mock('../auth/ws-session.validator', () => ({
  validateWsSession: jest.fn(),
}));

describe('V2G1-R2C1 MessagesGateway JWT hardening', () => {
  const signingSecret = randomBytes(48).toString('base64url');
  const otherSecret = randomBytes(48).toString('base64url');
  const userId = '507f1f77bcf86cd799439011';
  const connection = {} as any;
  const jwt = new JwtService({});

  const validator = validateWsSession as
    jest.MockedFunction<typeof validateWsSession>;

  let gateway: MessagesGateway;
  let configuredSecret: string | undefined;
  let previousEnvSecret: string | undefined;
  let logger: {
    log: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
  };

  beforeEach(() => {
    previousEnvSecret = process.env.JWT_SECRET;

    // Deliberately different from the configured signing secret.
    process.env.JWT_SECRET = otherSecret;
    configuredSecret = signingSecret;

    validator.mockReset();
    validator.mockResolvedValue({
      userId,
      user: {
        username: 'current-user',
        email: 'current@example.invalid',
        roles: ['member'],
      },
    } as any);

    logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    gateway = Object.create(
      MessagesGateway.prototype,
    ) as MessagesGateway;

    Object.assign(gateway, {
      jwtService: new JwtService({
        secret: otherSecret,
      }),
      configService: {
        get: jest.fn((key: string) =>
          key === 'JWT_SECRET'
            ? configuredSecret
            : undefined
        ),
      },
      connection,
      logger,
      userSockets: new Map(),
      socketUsers: new Map(),
      server: {
        emit: jest.fn(),
      },
    });
  });

  afterEach(() => {
    if (previousEnvSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousEnvSecret;
    }
  });

  function makeToken(
    options: Record<string, any> = {},
  ): string {
    return jwt.sign(
      {
        sub: userId,
        tokenVersion: 0,
        username: 'stale-user',
        email: 'stale@example.invalid',
      },
      {
        secret: signingSecret,
        expiresIn: '7d',
        ...options,
      },
    );
  }

  function makeClient(
    token?: string,
    transport: 'auth' | 'header' = 'auth',
  ): any {
    const client: any = {
      id: 'r2c1-test-socket',
      handshake: {
        auth: {},
        headers: {},
      },
      join: jest.fn(),
      disconnect: jest.fn(),
    };

    if (token !== undefined) {
      if (transport === 'auth') {
        client.handshake.auth.token = token;
      } else {
        client.handshake.headers.authorization =
          `Bearer ${token}`;
      }
    }

    return client;
  }

  it('uses the shared validator instead of a fallback', () => {
    const source = readFileSync(
      join(__dirname, 'messages.gateway.ts'),
      'utf8',
    );

    expect(source).toContain(
      'requireValidatedJwtSecret(',
    );

    expect(source).not.toContain(
      'dev_secret_change_me',
    );

    expect(source).not.toContain(
      'process.env.JWT_SECRET',
    );
  });

  it('accepts valid configured-secret JWTs and live identity', async () => {
    const client = makeClient(makeToken());

    await gateway.handleConnection(client);

    expect(client.disconnect).not.toHaveBeenCalled();
    expect(client.join).toHaveBeenCalledTimes(1);
    expect(client.userId).toBe(userId);
    expect(client.user.username).toBe('current-user');
    expect(client.user.userId).toBe(userId);

    expect(validator).toHaveBeenCalledWith(
      connection,
      expect.objectContaining({ sub: userId }),
    );
  });

  it('accepts the existing Bearer header transport', async () => {
    const client = makeClient(makeToken(), 'header');

    await gateway.handleConnection(client);

    expect(client.disconnect).not.toHaveBeenCalled();
    expect(validator).toHaveBeenCalledTimes(1);
  });

  it('disconnects sockets without credentials', async () => {
    const client = makeClient();

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledTimes(1);
    expect(validator).not.toHaveBeenCalled();
  });

  it('rejects an incorrectly signed JWT', async () => {
    const client = makeClient(
      makeToken({ secret: otherSecret }),
    );

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledTimes(1);
    expect(validator).not.toHaveBeenCalled();
  });

  it('rejects expired JWTs', async () => {
    const client = makeClient(
      makeToken({ expiresIn: -1 }),
    );

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledTimes(1);
    expect(validator).not.toHaveBeenCalled();
  });

  it('fails closed when ConfigService has no JWT secret', async () => {
    configuredSecret = undefined;

    // A strong process.env fallback must not rescue this path.
    const client = makeClient(makeToken());

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledTimes(1);
    expect(validator).not.toHaveBeenCalled();
  });

  it('rejects the known development signing secret', async () => {
    configuredSecret = 'dev_secret_change_me';

    const client = makeClient(makeToken());

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledTimes(1);
    expect(validator).not.toHaveBeenCalled();
  });

  it('rejects a short signing secret', async () => {
    configuredSecret = 'too-short';

    const client = makeClient(makeToken());

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledTimes(1);
    expect(validator).not.toHaveBeenCalled();
  });

  it('rejects signing secrets with surrounding whitespace', async () => {
    configuredSecret = signingSecret + ' ';

    const client = makeClient(makeToken());

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledTimes(1);
    expect(validator).not.toHaveBeenCalled();
  });

  it('rejects invalidated live database sessions', async () => {
    validator.mockRejectedValueOnce(
      new Error('Revoked session'),
    );

    const client = makeClient(makeToken());

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledTimes(1);
    expect(client.join).not.toHaveBeenCalled();
  });

  it('does not log rejected JWTs or secret values', async () => {
    const token = makeToken({
      secret: otherSecret,
    });

    const client = makeClient(token);

    await gateway.handleConnection(client);

    const logs = Object.values(logger)
      .flatMap((mock) => mock.mock.calls.flat())
      .join(' ');

    expect(client.disconnect).toHaveBeenCalled();
    expect(logs).not.toContain(token);
    expect(logs).not.toContain(signingSecret);
    expect(logs).not.toContain(otherSecret);
  });
});
