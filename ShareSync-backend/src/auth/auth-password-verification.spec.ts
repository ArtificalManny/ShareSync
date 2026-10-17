import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService password login hardening', () => {
  const password = 'OpenShare-login-test-password!';

  function makeService(user: unknown) {
    const service = Object.create(
      AuthService.prototype,
    ) as AuthService;

    const lean = jest.fn().mockResolvedValue(user);
    const select = jest.fn().mockReturnValue({ lean });
    const findOne = jest.fn().mockReturnValue({ select });
    const enforceAccountAllowed = jest.fn();

    Object.assign(service, {
      userModel: { findOne },
      enforceAccountAllowed,
    });

    return {
      service,
      findOne,
      select,
      enforceAccountAllowed,
    };
  }

  function mockUser(stored: unknown) {
    return {
      _id: 'test-user-id',
      email: 'test@example.com',
      username: 'test-user',
      password: stored,
    };
  }

  it('accepts a valid bcrypt cost-12 password', async () => {
    const hash = await bcrypt.hash(password, 12);
    const { service, select, enforceAccountAllowed } =
      makeService(mockUser(hash));

    const result = await service.validateUser(
      'TEST@example.com',
      password,
    );

    expect(select).toHaveBeenCalledWith('+password');
    expect(result.email).toBe('test@example.com');
    expect(result).not.toHaveProperty('password');
    expect(enforceAccountAllowed).toHaveBeenCalledTimes(1);
  });

  it('accepts an existing bcrypt cost-10 password', async () => {
    const hash = await bcrypt.hash(password, 10);
    const { service } = makeService(mockUser(hash));

    await expect(
      service.validateUser('test@example.com', password),
    ).resolves.toMatchObject({
      email: 'test@example.com',
    });
  });

  it('rejects an incorrect bcrypt password', async () => {
    const hash = await bcrypt.hash(password, 10);
    const { service, enforceAccountAllowed } =
      makeService(mockUser(hash));

    await expect(
      service.validateUser('test@example.com', 'incorrect'),
    ).rejects.toThrow('Invalid credentials');

    expect(enforceAccountAllowed).not.toHaveBeenCalled();
  });

  it('temporarily supports a nonempty legacy plaintext password', async () => {
    const { service } = makeService(mockUser(password));

    await expect(
      service.validateUser('test@example.com', password),
    ).resolves.toMatchObject({
      email: 'test@example.com',
    });
  });

  it('rejects an incorrect legacy plaintext password', async () => {
    const { service } = makeService(mockUser(password));

    await expect(
      service.validateUser('test@example.com', 'incorrect'),
    ).rejects.toThrow('Invalid credentials');
  });

  it('rejects empty input against an empty stored password', async () => {
    const { service, findOne } = makeService(mockUser(''));

    await expect(
      service.validateUser('test@example.com', ''),
    ).rejects.toThrow('Invalid credentials');

    expect(findOne).not.toHaveBeenCalled();
  });

  it('rejects empty input against a bcrypt password', async () => {
    const hash = await bcrypt.hash(password, 10);
    const { service, findOne } = makeService(mockUser(hash));

    await expect(
      service.validateUser('test@example.com', ''),
    ).rejects.toThrow('Invalid credentials');

    expect(findOne).not.toHaveBeenCalled();
  });

  it('rejects a missing stored password', async () => {
    const { service } = makeService(mockUser(undefined));

    await expect(
      service.validateUser('test@example.com', password),
    ).rejects.toThrow('Invalid credentials');
  });

  it('rejects malformed bcrypt-prefixed hashes', async () => {
    const malformed = '$2b$not-a-valid-bcrypt-hash';
    const { service } = makeService(mockUser(malformed));

    await expect(
      service.validateUser('test@example.com', malformed),
    ).rejects.toThrow('Invalid credentials');
  });

  it('rejects an unknown user', async () => {
    const { service } = makeService(null);

    await expect(
      service.validateUser('test@example.com', password),
    ).rejects.toThrow('Invalid credentials');
  });
});
