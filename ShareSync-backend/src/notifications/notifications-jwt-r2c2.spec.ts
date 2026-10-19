import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { NotificationsModule } from './notifications.module';
import { NotificationsGateway } from './notifications.gateway';
import { validateWsSession } from '../auth/ws-session.validator';

jest.mock('../auth/ws-session.validator', () => ({
  validateWsSession: jest.fn(),
}));

describe('V2G1-R2C2 Notifications JWT hardening', () => {
  const secret = randomBytes(48).toString('base64url');
  const otherSecret = randomBytes(48).toString('base64url');
  const userId = '507f1f77bcf86cd799439011';
  const connection = {} as any;

  const validator = validateWsSession as
    jest.MockedFunction<typeof validateWsSession>;

  let previousSecret: string | undefined;

  beforeEach(() => {
    previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = otherSecret;

    validator.mockReset();
    validator.mockResolvedValue({
      userId,
      user: {
        username: 'current-user',
        email: 'current@example.invalid',
      },
    } as any);
  });

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousSecret;
    }
  });

  function getJwtFactory(): (config: any) => any {
    const imports = Reflect.getMetadata(
      MODULE_METADATA.IMPORTS,
      NotificationsModule,
    ) as any[];

    const registrations = imports.filter(
      (item: any) => item?.module === JwtModule,
    );

    expect(registrations).toHaveLength(1);

    const optionsProviders =
      registrations[0].providers.filter(
        (provider: any) =>
          typeof provider?.useFactory === 'function',
      );

    expect(optionsProviders).toHaveLength(1);

    return optionsProviders[0].useFactory;
  }

  async function optionsFor(
    values: Record<string, string | undefined> = {
      JWT_SECRET: secret,
    },
  ): Promise<any> {
    return getJwtFactory()({
      get: (key: string) => values[key],
    });
  }

  async function makeGateway(): Promise<NotificationsGateway> {
    const gateway = Object.create(
      NotificationsGateway.prototype,
    ) as NotificationsGateway;

    Object.assign(gateway, {
      jwtService: new JwtService(await optionsFor()),
      connection,
      userSockets: new Map(),
      logger: {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    });

    return gateway;
  }

  function makeClient(
    token?: string,
    transport: 'auth' | 'header' = 'auth',
  ): any {
    const client: any = {
      id: 'r2c2-test-socket',
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

  function signToken(
    options: Record<string, any> = {},
  ): string {
    const jwt = new JwtService({});

    return jwt.sign(
      {
        sub: userId,
        tokenVersion: 0,
        username: 'old-user',
      },
      {
        secret,
        expiresIn: '7d',
        ...options,
      },
    );
  }

  it('contains no alternate JWT fallback chain', () => {
    const source = readFileSync(
      join(__dirname, 'notifications.module.ts'),
      'utf8',
    );

    expect(source).toContain(
      "requireValidatedJwtSecret(",
    );

    expect(source).not.toContain(
      "config.get<string>('JWT_ACCESS_SECRET')",
    );

    expect(source).not.toContain(
      "process.env.JWT_SECRET",
    );
  });

  it('configures JWT verification with validated JWT_SECRET', async () => {
    const options = await optionsFor();

    expect(options.secret).toBe(secret);
    expect(options.signOptions).toBeDefined();
  });

  it('fails closed when JWT_SECRET is missing', async () => {
    await expect(optionsFor({})).rejects.toThrow(
      'JWT_SECRET configuration is missing or insecure',
    );
  });

  it('does not accept only a process environment fallback', async () => {
    process.env.JWT_SECRET = secret;

    await expect(optionsFor({})).rejects.toThrow(
      'JWT_SECRET configuration is missing or insecure',
    );
  });

  it('does not accept JWT_ACCESS_SECRET as an alias', async () => {
    await expect(optionsFor({
      JWT_ACCESS_SECRET: secret,
    })).rejects.toThrow();
  });

  it('does not accept JWT_ACCESS_TOKEN_SECRET as an alias', async () => {
    await expect(optionsFor({
      JWT_ACCESS_TOKEN_SECRET: secret,
    })).rejects.toThrow();
  });

  it('rejects the development JWT secret', async () => {
    await expect(optionsFor({
      JWT_SECRET: 'dev_secret_change_me',
    })).rejects.toThrow();
  });

  it('rejects a short JWT secret', async () => {
    await expect(optionsFor({
      JWT_SECRET: 'too-short',
    })).rejects.toThrow();
  });

  it('rejects a JWT secret with surrounding whitespace', async () => {
    await expect(optionsFor({
      JWT_SECRET: secret + ' ',
    })).rejects.toThrow();
  });

  it('rejects low-diversity JWT secrets', async () => {
    await expect(optionsFor({
      JWT_SECRET: 'a'.repeat(48),
    })).rejects.toThrow();
  });

  it('accepts a signed JWT and validates the live session', async () => {
    const gateway = await makeGateway();
    const client = makeClient(signToken());

    await gateway.handleConnection(client);

    expect(client.disconnect).not.toHaveBeenCalled();
    expect(client.userId).toBe(userId);
    expect(client.join).toHaveBeenCalledTimes(1);

    expect(validator).toHaveBeenCalledWith(
      connection,
      expect.objectContaining({ sub: userId }),
    );
  });

  it('accepts the existing Bearer-header transport', async () => {
    const gateway = await makeGateway();
    const client = makeClient(signToken(), 'header');

    await gateway.handleConnection(client);

    expect(client.disconnect).not.toHaveBeenCalled();
    expect(validator).toHaveBeenCalledTimes(1);
  });

  it('disconnects sockets without credentials', async () => {
    const gateway = await makeGateway();
    const client = makeClient();

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledTimes(1);
    expect(validator).not.toHaveBeenCalled();
  });

  it('rejects incorrectly signed JWTs', async () => {
    const gateway = await makeGateway();
    const client = makeClient(
      signToken({ secret: otherSecret }),
    );

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledTimes(1);
    expect(validator).not.toHaveBeenCalled();
  });

  it('rejects expired JWTs', async () => {
    const gateway = await makeGateway();
    const client = makeClient(
      signToken({ expiresIn: -1 }),
    );

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledTimes(1);
    expect(validator).not.toHaveBeenCalled();
  });

  it('rejects invalidated database sessions', async () => {
    validator.mockRejectedValueOnce(
      new Error('Revoked notification session'),
    );

    const gateway = await makeGateway();
    const client = makeClient(signToken());

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledTimes(1);
    expect(client.join).not.toHaveBeenCalled();
  });
});
