describe('R54 public project branding R2 persistence', () => {
  const envKeys = [
    'R2_BUCKET', 'R2_ENDPOINT', 'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY', 'R2_PUBLIC_BASE_URL',
  ];
  const originals = Object.fromEntries(envKeys.map(k => [k, process.env[k]]));
  let send: jest.Mock;

  function load(enabled = true) {
    jest.resetModules();
    jest.doMock('@aws-sdk/client-s3', () => ({
      S3Client: jest.fn().mockImplementation(() => ({ send })),
      PutObjectCommand: class { constructor(public readonly input: any) {} },
      GetObjectCommand: class { constructor(public readonly input: any) {} },
      DeleteObjectCommand: class { constructor(public readonly input: any) {} },
    }));
    process.env.R2_BUCKET = enabled ? 'r54-public-fixture' : '';
    process.env.R2_ENDPOINT = enabled ? 'https://r2.example.invalid' : '';
    process.env.R2_ACCESS_KEY_ID = enabled ? 'r54-dummy' : '';
    process.env.R2_SECRET_ACCESS_KEY = enabled ? 'r54-dummy' : '';
    process.env.R2_PUBLIC_BASE_URL = enabled ? 'https://public.example.invalid' : '';
    const { UploadsService } = require('./uploads.service');
    return new UploadsService();
  }

  const png = (overrides: any = {}) => ({
    mimetype: 'image/png', originalname: 'logo.svg',
    size: 12, buffer: Buffer.from('test-content'), ...overrides,
  });

  beforeEach(() => { send = jest.fn().mockResolvedValue({}); });
  afterEach(() => {
    for (const key of envKeys) {
      if (originals[key] === undefined) delete process.env[key];
      else process.env[key] = originals[key];
    }
    jest.dontMock('@aws-sdk/client-s3');
    jest.resetModules();
  });

  it('saves a logo into the public R2 bucket under an unguessable project-specific key', async () => {
    const service = load();
    const stored = await service.uploadProjectBranding(
      png(), '507f1f77bcf86cd799439011', 'logo',
    );
    expect(stored.storageProvider).toBe('r2');
    expect(stored.storageBucket).toBe('r54-public-fixture');
    expect(stored.storageKey).toMatch(
      /^project-branding\/507f1f77bcf86cd799439011\/logo\/[0-9a-f-]{36}\.png$/,
    );
    expect(stored.url).toBe('https://public.example.invalid/' + stored.storageKey);
    expect(send).toHaveBeenCalledTimes(1);
    const cmd = send.mock.calls[0][0];
    expect(cmd.input.Bucket).toBe('r54-public-fixture');
    expect(cmd.input.ContentType).toBe('image/png');
    expect(cmd.input.CacheControl).toContain('immutable');
    expect(cmd.input.Body.equals(Buffer.from('test-content'))).toBe(true);
    expect(cmd.input.ContentLength).toBe(Buffer.byteLength('test-content'));
    expect(stored.storageKey).not.toContain('.svg');
  });

  it('uses a separate namespace for project banners', async () => {
    const service = load();
    const stored = await service.uploadProjectBranding(
      png({ mimetype: 'image/jpeg' }), '507f1f77bcf86cd799439011', 'banner',
    );
    expect(stored.storageKey).toMatch(/\/banner\/[0-9a-f-]{36}\.jpg$/);
  });

  it('fails closed when public R2 is not configured', async () => {
    const service = load(false);
    expect(service.isPublicStorageEnabled()).toBe(false);
    await expect(service.uploadProjectBranding(
      png(), '507f1f77bcf86cd799439011', 'logo',
    )).rejects.toMatchObject({ status: 503 });
    expect(send).not.toHaveBeenCalled();
  });

  it('never uploads HTML/SVG even with forged client metadata', async () => {
    const service = load();
    await expect(service.uploadProjectBranding(
      png({ mimetype: 'image/svg+xml' }), '507f1f77bcf86cd799439011', 'logo',
    )).rejects.toMatchObject({ status: 400 });
    expect(send).not.toHaveBeenCalled();
  });

  it('rejects invalid identifiers, invalid kinds and oversized files', async () => {
    const service = load();
    await expect(service.uploadProjectBranding(png(), '../other-project', 'logo'))
      .rejects.toMatchObject({ status: 400 });
    await expect(service.uploadProjectBranding(
      png(), '507f1f77bcf86cd799439011', 'wrong',
    )).rejects.toMatchObject({ status: 400 });
    await expect(service.uploadProjectBranding(
      png({ size: 5 * 1024 * 1024 + 1 }), '507f1f77bcf86cd799439011', 'logo',
    )).rejects.toMatchObject({ status: 400 });
    expect(send).not.toHaveBeenCalled();
  });

  it('rejects a declared size different from actual bytes before writing to R2', async () => {
    const service = load();
    await expect(service.uploadProjectBranding(
      png({ size: 200 }), '507f1f77bcf86cd799439011', 'logo',
    )).rejects.toMatchObject({ status: 400 });
    expect(send).not.toHaveBeenCalled();
  });

  it('does not fall back to local disk when R2 fails', async () => {
    const service = load();
    send.mockRejectedValue(new Error('S3 API unavailable'));
    await expect(service.uploadProjectBranding(
      png(), '507f1f77bcf86cd799439011', 'logo',
    )).rejects.toThrow('S3 API unavailable');
  });
});
