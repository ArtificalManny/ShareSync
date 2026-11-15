import { BadRequestException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { imageExtensionMatches, detectUploadImageSignature } from '../common/upload-image-signature';

jest.mock('../common/upload-image-signature', () => ({
  detectUploadImageSignature: jest.fn(async () => 'image/png'),
  imageExtensionMatches: jest.fn(() => true),
  canonicalImageExtension: jest.fn(() => 'png'),
}));
jest.mock('../moderation/policy', () => ({
  policyForUpload: jest.fn(() => ({ decision: 'ALLOW', reason: 'Allowed' })),
}));

describe('R54 project branding controller — storage boundary', () => {
  let dir: string;
  let file: Express.Multer.File;
  let projects: any;
  let uploads: any;
  let moderation: any;
  let imageModeration: any;
  let controller: ProjectsController;

  const projectId = '507f1f77bcf86cd799439011';
  const url = 'https://public.example.invalid/project-branding/507f1f77bcf86cd799439011/logo/test.png';

  beforeEach(() => {
    jest.clearAllMocks();
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r54-branding-'));
    const filePath = path.join(dir, 'logo.png');
    fs.writeFileSync(filePath, Buffer.from('test-data'));
    file = {
      path: filePath,
      filename: 'logo.png',
      mimetype: 'image/png',
      originalname: 'logo.png',
      size: 9,
    } as Express.Multer.File;
    projects = {
      assertProjectEditableByUser: jest.fn().mockResolvedValue({}),
      updateProjectBranding: jest.fn().mockResolvedValue({ _id: projectId, logoUrl: url }),
      assertProjectWritableForBilling: jest.fn().mockResolvedValue(undefined),
      isProjectBrandingUrlCurrent: jest.fn().mockResolvedValue(false),
    };
    uploads = {
      isPublicStorageEnabled: jest.fn(() => true),
      uploadProjectBranding: jest.fn().mockResolvedValue({
        url, storageProvider: 'r2',
        storageKey: 'project-branding/507f1f77bcf86cd799439011/logo/test.png',
        storageBucket: 'public-test',
      }),
      deleteStoredObject: jest.fn().mockResolvedValue(undefined),
    };
    moderation = {
      virusScan: jest.fn().mockResolvedValue({ status: 'clean' }),
      logDecision: jest.fn().mockResolvedValue(undefined),
    };
    imageModeration = {
      moderateImage: jest.fn().mockResolvedValue({ action: 'allow', labels: [] }),
    };
    controller = new ProjectsController(
      projects, {} as any, moderation, imageModeration, uploads,
    );
  });

  afterEach(() => {
    fs.rmSync(dir, { force: true, recursive: true });
  });

  const request = { user: { sub: '507f1f77bcf86cd799439012' } };

  it('uploads an authorized logo to R2, commits its URL and removes temporary bytes', async () => {
    const originalPath = file.path;
    const response = await controller.uploadBrandingImage(request, projectId, file, 'logo');
    expect(response.data.url).toBe(url);
    expect(uploads.uploadProjectBranding).toHaveBeenCalledWith(file, projectId, 'logo');
    expect(projects.updateProjectBranding).toHaveBeenCalledWith(projectId, request.user.sub, 'logo', url);
    expect(moderation.virusScan).toHaveBeenCalledTimes(1);
    expect(imageModeration.moderateImage).toHaveBeenCalledTimes(1);
    expect(fs.existsSync(originalPath)).toBe(false);
    expect(uploads.deleteStoredObject).not.toHaveBeenCalled();
  });

  it('keeps the banner kind and API response contract', async () => {
    await controller.uploadBrandingImage(request, projectId, file, 'banner');
    expect(uploads.uploadProjectBranding).toHaveBeenCalledWith(file, projectId, 'banner');
  });

  it('rejects an unauthorized editor before scanning or uploading', async () => {
    const originalPath = file.path;
    projects.assertProjectEditableByUser.mockRejectedValue(new ForbiddenException());
    await expect(controller.uploadBrandingImage(request, projectId, file, 'logo'))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(uploads.uploadProjectBranding).not.toHaveBeenCalled();
    expect(moderation.virusScan).not.toHaveBeenCalled();
    expect(fs.existsSync(originalPath)).toBe(false);
  });

  it('rejects a billing read-only project before any R2 mutation', async () => {
    projects.assertProjectWritableForBilling.mockRejectedValue(new ForbiddenException());
    await expect(controller.uploadBrandingImage(request, projectId, file, 'logo'))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(uploads.uploadProjectBranding).not.toHaveBeenCalled();
  });

  it('fails closed without R2 instead of storing a new local reference', async () => {
    uploads.isPublicStorageEnabled.mockReturnValue(false);
    await expect(controller.uploadBrandingImage(request, projectId, file, 'logo'))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(uploads.uploadProjectBranding).not.toHaveBeenCalled();
    expect(projects.updateProjectBranding).not.toHaveBeenCalled();
  });

  it('does not publish images blocked by moderation', async () => {
    imageModeration.moderateImage.mockResolvedValue({ action: 'block', reason: 'Rejected', labels: [] });
    await expect(controller.uploadBrandingImage(request, projectId, file, 'logo'))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(uploads.uploadProjectBranding).not.toHaveBeenCalled();
  });

  it('fails on invalid bytes before the R2 write', async () => {
    (detectUploadImageSignature as jest.Mock).mockResolvedValueOnce(null);
    await expect(controller.uploadBrandingImage(request, projectId, file, 'logo'))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(uploads.uploadProjectBranding).not.toHaveBeenCalled();
  });

  it('rejects unsupported kinds rather than silently overwriting a logo', async () => {
    await expect(controller.uploadBrandingImage(request, projectId, file, 'unknown'))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(uploads.uploadProjectBranding).not.toHaveBeenCalled();
  });

  it('cleans up local temporary bytes when R2 write fails', async () => {
    const originalPath = file.path;
    uploads.uploadProjectBranding.mockRejectedValue(new Error('R2 unavailable'));
    await expect(controller.uploadBrandingImage(request, projectId, file, 'logo'))
      .rejects.toThrow('R2 unavailable');
    expect(projects.updateProjectBranding).not.toHaveBeenCalled();
    expect(fs.existsSync(originalPath)).toBe(false);
  });

  it('rolls back ONLY the new R2 object when the Mongo update fails safely', async () => {
    projects.updateProjectBranding.mockRejectedValue(new Error('Mongo update failed'));
    await expect(controller.uploadBrandingImage(request, projectId, file, 'logo'))
      .rejects.toThrow('Mongo update failed');
    expect(projects.isProjectBrandingUrlCurrent).toHaveBeenCalledWith(projectId, 'logo', url);
    expect(uploads.deleteStoredObject).toHaveBeenCalledTimes(1);
    expect(uploads.deleteStoredObject.mock.calls[0][0]).toMatchObject({
      url, storageProvider: 'r2', storageBucket: 'public-test',
    });
  });

  it('never deletes an R2 object already referenced after an uncertain Mongo response', async () => {
    projects.updateProjectBranding.mockRejectedValue(new Error('Ambiguous response'));
    projects.isProjectBrandingUrlCurrent.mockResolvedValue(true);
    await expect(controller.uploadBrandingImage(request, projectId, file, 'logo'))
      .rejects.toThrow('Ambiguous response');
    expect(uploads.deleteStoredObject).not.toHaveBeenCalled();
  });

  it('preserves an object if the database is unreachable during rollback verification', async () => {
    projects.updateProjectBranding.mockRejectedValue(new Error('Timeout'));
    projects.isProjectBrandingUrlCurrent.mockRejectedValue(new Error('DB down'));
    await expect(controller.uploadBrandingImage(request, projectId, file, 'logo'))
      .rejects.toThrow('Timeout');
    expect(uploads.deleteStoredObject).not.toHaveBeenCalled();
  });

  it('normalizes a renamed upload and still cleans the final temporary filename', async () => {
    (imageExtensionMatches as jest.Mock).mockReturnValueOnce(false);
    file.filename = 'wrong.jpeg';
    const old = file.path;
    await controller.uploadBrandingImage(request, projectId, file, 'logo');
    expect(file.filename).toBe('wrong.png');
    expect(fs.existsSync(old)).toBe(false);
    expect(fs.existsSync(file.path)).toBe(false);
  });
});

describe('R54 project branding service — trusted updates', () => {
  let service: any;
  let projectModel: any;
  const projectId = '507f1f77bcf86cd799439011';
  const userId = '507f1f77bcf86cd799439012';

  beforeEach(() => {
    projectModel = {
      findByIdAndUpdate: jest.fn().mockImplementation((_id, update) => ({
        exec: async () => ({ _id: projectId, ...update.$set }),
      })),
      findById: jest.fn().mockReturnValue({
        select: () => ({ lean: () => ({ exec: async () => ({ logoUrl: 'https://test.invalid/logo' }) }) }),
      }),
    };
    service = Object.create(ProjectsService.prototype);
    service.projectModel = projectModel;
    service.eventEmitter = { emit: jest.fn() };
    service.logger = { warn: jest.fn() };
    service.findByIdWithAccess = jest.fn().mockResolvedValue({ logoUrl: '/uploads/old.png' });
    service.canEdit = jest.fn().mockReturnValue(true);
    service.assertProjectEditableByUser = jest.fn().mockResolvedValue({});
    service.assertProjectWritableForBilling = jest.fn().mockResolvedValue(undefined);
  });

  it('rejects new logo URLs on generic project PUT', async () => {
    await expect(service.update(projectId, userId, { logoUrl: 'https://remote.invalid/unapproved.png' }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(projectModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('accepts unchanged legacy branding URLs without writing them again', async () => {
    await service.update(projectId, userId, { name: 'Renamed', logoUrl: '/uploads/old.png' });
    const patch = projectModel.findByIdAndUpdate.mock.calls[0][1].$set;
    expect(patch.name).toBe('Renamed');
    expect(patch.logoUrl).toBeUndefined();
  });

  it('trusted branding update enforces authorization and billing before saving', async () => {
    await service.updateProjectBranding(projectId, userId, 'logo', 'https://test.invalid/logo');
    expect(service.assertProjectEditableByUser).toHaveBeenCalledWith(projectId, userId);
    expect(service.assertProjectWritableForBilling).toHaveBeenCalledWith(projectId);
    expect(projectModel.findByIdAndUpdate.mock.calls[0][1].$set.logoUrl)
      .toBe('https://test.invalid/logo');
  });

  it('a denied trusted branding update never mutates MongoDB', async () => {
    service.assertProjectEditableByUser.mockRejectedValue(new ForbiddenException());
    await expect(service.updateProjectBranding(projectId, userId, 'banner', 'https://test.invalid/banner'))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(projectModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('a billing read-only project cannot change shared branding', async () => {
    service.assertProjectWritableForBilling.mockRejectedValue(new ForbiddenException());
    await expect(service.updateProjectBranding(projectId, userId, 'logo', 'https://test.invalid/logo'))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(projectModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('an event listener exception cannot trigger rollback after a persisted pointer', async () => {
    service.eventEmitter.emit.mockImplementation(() => { throw new Error('listener failed'); });
    const result = await service.updateProjectBranding(projectId, userId, 'logo', 'https://test.invalid/logo');
    expect(result.logoUrl).toBe('https://test.invalid/logo');
    expect(service.logger.warn).toHaveBeenCalledTimes(1);
  });
});
