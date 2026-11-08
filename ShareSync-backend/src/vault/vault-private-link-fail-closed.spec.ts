import { NotFoundException } from '@nestjs/common';
import { VaultService } from './vault.service';

describe('VaultService private file links: fail closed', () => {
  const fileId = '507f1f77bcf86cd799439011';
  const publicUrl = 'https://public.example.test/vault/file.png';
  const signedUrl = 'https://private.example.test/file?synthetic=1';
  const expiresAt = '2030-01-01T00:00:00.000Z';
  const storageKey =
    'vault/test-team/12345678-1234-1234-1234-123456789abc.png';

  let service: VaultService;
  let signer: jest.Mock;

  const record = (overrides: Record<string, unknown> = {}) => ({
    _id: fileId,
    originalName: 'example.png',
    mimeType: 'image/png',
    storageProvider: 'r2-private',
    storageBucket: 'private-test-bucket',
    storageKey,
    fileUrl: `vault-private:${fileId}`,
    ...overrides,
  });

  const link = (
    file: Record<string, unknown>,
    options: { download?: boolean } = {},
  ): Promise<any> =>
    (service as any).buildFileLink(file, options);

  beforeEach(() => {
    signer = jest.fn().mockResolvedValue({
      url: signedUrl,
      expiresAt,
    });

    // No application bootstrap, database or real S3 client.
    service = Object.create(VaultService.prototype) as VaultService;
    (service as any).uploadsService = {
      createPrivateFileLink: signer,
    };
  });

  it('rejects missing private key even with a public URL', async () => {
    await expect(
      link(record({ storageKey: null, fileUrl: publicUrl })),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(signer).not.toHaveBeenCalled();
  });

  it('rejects an empty private key with a public URL', async () => {
    await expect(
      link(record({ storageKey: '', fileUrl: publicUrl })),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(signer).not.toHaveBeenCalled();
  });

  it('rejects missing private key with a placeholder', async () => {
    await expect(
      link(record({ storageKey: undefined })),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(signer).not.toHaveBeenCalled();
  });

  it('delegates valid private files to the signer', async () => {
    const result = await link(record());

    expect(signer).toHaveBeenCalledWith(
      {
        storageKey,
        storageBucket: 'private-test-bucket',
      },
      {
        download: false,
        fileName: 'example.png',
        mimeType: 'image/png',
      },
    );

    expect(result).toMatchObject({
      fileId,
      url: signedUrl,
      expiresAt,
      isPrivate: true,
    });
  });

  it('never falls back to a public URL on signer failure', async () => {
    signer.mockRejectedValueOnce(
      new Error('Synthetic signing failure'),
    );

    await expect(
      link(record({ fileUrl: publicUrl })),
    ).rejects.toThrow('Synthetic signing failure');
  });

  it('preserves legitimate legacy public URLs', async () => {
    const result = await link(
      record({
        storageProvider: null,
        storageKey: null,
        storageBucket: null,
        fileUrl: publicUrl,
      }),
    );

    expect(result).toMatchObject({
      url: publicUrl,
      isPrivate: false,
      expiresAt: null,
    });

    expect(signer).not.toHaveBeenCalled();
  });

  it('rejects private placeholders on legacy records', async () => {
    await expect(
      link(
        record({
          storageProvider: null,
          storageKey: null,
        }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects missing legacy URLs', async () => {
    await expect(
      link(
        record({
          storageProvider: null,
          storageKey: null,
          fileUrl: '',
        }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('forwards explicit download requests to the signer', async () => {
    await link(record(), { download: true });

    expect(signer).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        download: true,
      }),
    );
  });
});
