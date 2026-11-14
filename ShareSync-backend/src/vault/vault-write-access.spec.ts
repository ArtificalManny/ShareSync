import { ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Types } from 'mongoose';
import { READ_ONLY_MESSAGE } from '../common/guards/project-write-standing';
import { VaultService } from './vault.service';

// openshare-project-write-standing-v1 (R53)
//
// Vault writes need a writer (the owner, or a member whose role is owner,
// admin or member). The folder a write puts a file into, or takes one out of,
// must be one of the project's folders that the writer can open. A file in a
// private folder is announced only to the people who can open that folder.

const ID = {
  owner: '64a000000000000000000001',
  admin: '64a000000000000000000002',
  member: '64a000000000000000000003',
  norole: '64a000000000000000000004',
  viewer: '64a000000000000000000005',
  guest: '64a000000000000000000006',
  outsider: '64a000000000000000000007',
};
type Who = keyof typeof ID;
const WRITERS: Who[] = ['owner', 'admin', 'member', 'norole'];
const READERS: Who[] = ['viewer', 'guest'];
const PROJECT_ID = '64a0000000000000000000aa';
const OTHER_PROJECT_ID = '64a0000000000000000000ab';
const FILE_ID = '64a0000000000000000000ee';
const PRIVATE_FOLDER = '64a0000000000000000000f1';
const SHARED_FOLDER = '64a0000000000000000000f2';
const PUBLIC_FOLDER = '64a0000000000000000000f3';
const FOREIGN_FOLDER = '64a0000000000000000000f4';

const oid = (id: string) => new Types.ObjectId(id);

function project() {
  return {
    _id: oid(PROJECT_ID),
    name: 'Estate',
    ownerId: oid(ID.owner),
    members: [
      { userId: oid(ID.admin), role: 'admin' },
      { userId: oid(ID.member), role: 'member' },
      { userId: oid(ID.norole) },
      { userId: oid(ID.viewer), role: 'viewer' },
      { userId: oid(ID.guest), role: 'guest' },
    ],
    visibility: 'public',
    status: 'active',
  };
}

// Folders of the project: a private one only the admin can open, a private one
// the admin shared with the member and the viewer, and a public one; plus a
// folder of another project.
const FOLDERS = [
  { _id: oid(PRIVATE_FOLDER), projectId: oid(PROJECT_ID), accessLevel: 'private', createdBy: oid(ID.admin), allowedUsers: [] },
  { _id: oid(SHARED_FOLDER), projectId: oid(PROJECT_ID), accessLevel: 'private', createdBy: oid(ID.admin), allowedUsers: [oid(ID.member), oid(ID.viewer)] },
  { _id: oid(PUBLIC_FOLDER), projectId: oid(PROJECT_ID), accessLevel: 'public', createdBy: oid(ID.admin), allowedUsers: [] },
  { _id: oid(FOREIGN_FOLDER), projectId: oid(OTHER_PROJECT_ID), accessLevel: 'public', createdBy: oid(ID.owner), allowedUsers: [] },
];

function folderModel() {
  return {
    // Like MongoDB: a query without a project matches a folder of any project.
    findOne: jest.fn((query: any) => ({
      exec: async () =>
        FOLDERS.find((f) => String(f._id) === String(query._id) && (!('projectId' in query) || String(f.projectId) === String(query.projectId))) || null,
    })),
  };
}

async function outcome(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
    return 'done';
  } catch (error: any) {
    if (error instanceof ForbiddenException) return `403 ${error.message}`;
    if (error instanceof NotFoundException) return `404 ${error.message}`;
    if (error instanceof HttpException) return `${error.getStatus()} ${error.message}`;
    return String(error?.message || error);
  }
}

function vault(opts: { billing?: 'reached' | 'passes'; file?: any } = {}) {
  const saved: any[] = [];
  const FileModel: any = function (this: any, doc: any) {
    Object.assign(this, doc);
    this.save = jest.fn(async () => {
      saved.push(this);
      return this;
    });
  };
  FileModel.db = { collection: () => ({ findOne: jest.fn(async () => project()) }) };
  FileModel.findById = jest.fn(() => ({ exec: async () => opts.file || null }));
  FileModel.deleteOne = jest.fn(() => ({ exec: async () => ({ deletedCount: 1 }) }));

  const notificationsService = { create: jest.fn(), notify: jest.fn(async () => ({})) };
  const subscriptionsService = {
    getProjectWriteAccess: jest.fn(async () => {
      if ((opts.billing || 'reached') === 'reached') throw new Error('REACHED_BILLING');
      return { writable: true };
    }),
    getProjectMemberAccess: jest.fn(async () => ({ active: true })),
    checkProjectStorageLimit: jest.fn(async () => ({ allowed: true })),
  };
  const uploadsService = {
    isPrivateStorageEnabled: () => true,
    uploadPrivateFile: jest.fn(async () => ({
      storageProvider: 'r2-private',
      storageKey: 'vault/key',
      storageBucket: 'vault-bucket',
      name: 'plan.pdf',
      size: 3,
      mime: 'application/pdf',
    })),
    deleteStoredObject: jest.fn(async () => undefined),
  };
  const s: any = Object.assign(Object.create(VaultService.prototype), {
    fileModel: FileModel,
    folderModel: folderModel(),
    subscriptionsService,
    uploadsService,
    eventEmitter: { emit: jest.fn() },
    moduleRef: { get: (token: unknown) => (typeof token === 'string' ? null : notificationsService) },
    logger: { log: () => undefined, warn: () => undefined, error: () => undefined },
  });
  const activity = jest.spyOn(s, 'recordProjectActivity').mockResolvedValue(undefined);
  return { s, subscriptionsService, uploadsService, notificationsService, activity, saved, FileModel };
}

function upload(name = 'plan.pdf', tempPath = '') {
  return { originalname: name, mimetype: 'application/pdf', size: 3, path: tempPath } as any;
}

describe('Vault writes need a writer (R53)', () => {
  it.each(WRITERS)('the %s can create a folder', async (who) => {
    const { s } = vault();
    expect(await outcome(() => s.createFolder(PROJECT_ID, ID[who], 'Plans', 'public'))).toBe('REACHED_BILLING');
  });

  it.each(READERS)('a %s cannot create a folder', async (who) => {
    const { s, subscriptionsService } = vault();
    expect(await outcome(() => s.createFolder(PROJECT_ID, ID[who], 'Plans', 'public'))).toBe(`403 ${READ_ONLY_MESSAGE}`);
    expect(subscriptionsService.getProjectWriteAccess).not.toHaveBeenCalled();
  });

  it('someone outside the project cannot either', async () => {
    const { s } = vault();
    expect(await outcome(() => s.createFolder(PROJECT_ID, ID.outsider, 'Plans', 'public'))).toBe('403 You do not have permission to modify this project Vault');
  });

  it.each(READERS)('a %s cannot upload, and the waiting upload is removed', async (who) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r53-vault-'));
    const temp = path.join(dir, 'upload.tmp');
    fs.writeFileSync(temp, 'abc');
    const { s, uploadsService } = vault();
    expect(await outcome(() => s.uploadFile(PROJECT_ID, ID[who], upload('plan.pdf', temp)))).toBe(`403 ${READ_ONLY_MESSAGE}`);
    expect(fs.existsSync(temp)).toBe(false);
    expect(uploadsService.uploadPrivateFile).not.toHaveBeenCalled();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('the folder an upload goes into (R53)', () => {
  it('must exist', async () => {
    const { s, subscriptionsService } = vault();
    expect(await outcome(() => s.uploadFile(PROJECT_ID, ID.member, upload(), '64a0000000000000000000ff'))).toBe('404 Destination folder not found');
    expect(subscriptionsService.getProjectWriteAccess).not.toHaveBeenCalled();
  });

  it("can't be another project's folder", async () => {
    const { s } = vault();
    expect(await outcome(() => s.uploadFile(PROJECT_ID, ID.owner, upload(), FOREIGN_FOLDER))).toBe('404 Destination folder not found');
  });

  it("can't be a private folder the uploader can't open, even for the owner", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r53-vault-'));
    const temp = path.join(dir, 'upload.tmp');
    fs.writeFileSync(temp, 'abc');
    const { s, uploadsService } = vault();
    expect(await outcome(() => s.uploadFile(PROJECT_ID, ID.owner, upload('plan.pdf', temp), PRIVATE_FOLDER))).toBe('403 You do not have access to this folder');
    expect(fs.existsSync(temp)).toBe(false);
    expect(uploadsService.uploadPrivateFile).not.toHaveBeenCalled();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('can be a private folder shared with the uploader', async () => {
    const { s } = vault();
    expect(await outcome(() => s.uploadFile(PROJECT_ID, ID.member, upload(), SHARED_FOLDER))).toBe('REACHED_BILLING');
  });

  it('can be a public folder or the top of the Vault', async () => {
    expect(await outcome(() => vault().s.uploadFile(PROJECT_ID, ID.norole, upload(), PUBLIC_FOLDER))).toBe('REACHED_BILLING');
    expect(await outcome(() => vault().s.uploadFile(PROJECT_ID, ID.norole, upload()))).toBe('REACHED_BILLING');
  });
});

describe('who hears about an upload (R53)', () => {
  const told = (n: any) => n.notify.mock.calls.map((c: any[]) => String(c[0].userId)).sort();

  it('a file in a private folder: only the people who can open it, and no project feed entry', async () => {
    const { s, notificationsService, activity, saved } = vault({ billing: 'passes' });
    await s.uploadFile(PROJECT_ID, ID.member, upload('salaries.xlsx'), SHARED_FOLDER);
    expect(saved).toHaveLength(1);
    expect(String(saved[0].folderId)).toBe(SHARED_FOLDER);
    // The admin made the folder and shared it with the member (the uploader)
    // and the viewer. Nobody else in the project hears about it.
    expect(told(notificationsService)).toEqual([ID.admin, ID.viewer].sort());
    expect(activity).not.toHaveBeenCalled();
  });

  it('a file in a public folder: everyone in the project but the uploader, and the feed', async () => {
    const { s, notificationsService, activity } = vault({ billing: 'passes' });
    await s.uploadFile(PROJECT_ID, ID.member, upload(), PUBLIC_FOLDER);
    expect(told(notificationsService)).toEqual([ID.owner, ID.admin, ID.norole, ID.viewer, ID.guest].sort());
    expect(activity).toHaveBeenCalledTimes(1);
  });

  it('a file at the top of the Vault: the same as a public folder', async () => {
    const { s, notificationsService, activity } = vault({ billing: 'passes' });
    await s.uploadFile(PROJECT_ID, ID.admin, upload());
    expect(told(notificationsService)).toEqual([ID.owner, ID.member, ID.norole, ID.viewer, ID.guest].sort());
    expect(activity).toHaveBeenCalledTimes(1);
  });

  it("a private folder's name stays out of the feed when it's created", async () => {
    const run = async (accessLevel: 'public' | 'private') => {
      const { s, activity } = vault({ billing: 'passes' });
      s.folderModel = Object.assign(function (this: any, doc: any) {
        Object.assign(this, doc);
        this.save = async () => ({ ...doc, _id: oid(PUBLIC_FOLDER) });
      }, folderModel());
      await s.createFolder(PROJECT_ID, ID.admin, 'Payroll', accessLevel);
      return activity.mock.calls.length;
    };
    expect(await run('private')).toBe(0);
    expect(await run('public')).toBe(1);
  });
});

function vaultFile(folderId: string | null, uploadedBy = ID.member) {
  const file: any = {
    _id: oid(FILE_ID),
    projectId: oid(PROJECT_ID),
    folderId: folderId ? oid(folderId) : null,
    originalName: 'plan.pdf',
    uploadedBy: oid(uploadedBy),
    fileUrl: 'vault-private://x',
    storageProvider: 'r2-private',
    storageKey: 'vault/key',
  };
  file.save = jest.fn(async () => file);
  return file;
}

describe('renaming, moving or deleting a file (R53)', () => {
  it("a file in a private folder can't be managed by someone who can't open the folder, even the owner", async () => {
    for (const run of [
      (s: any) => s.renameFile(FILE_ID, ID.owner, 'renamed.pdf'),
      (s: any) => s.moveFile(FILE_ID, ID.owner, null),
      (s: any) => s.deleteFile(FILE_ID, ID.owner),
    ]) {
      const file = vaultFile(PRIVATE_FOLDER, ID.admin);
      const { s, uploadsService, FileModel } = vault({ billing: 'passes', file });
      expect(await outcome(() => run(s))).toBe('403 You do not have permission to manage this file');
      expect(file.save).not.toHaveBeenCalled();
      expect(uploadsService.deleteStoredObject).not.toHaveBeenCalled();
      expect(FileModel.deleteOne).not.toHaveBeenCalled();
    }
  });

  it('the uploader who can open the folder can manage it', async () => {
    const file = vaultFile(SHARED_FOLDER, ID.member);
    const { s } = vault({ billing: 'passes', file });
    const renamed = await s.renameFile(FILE_ID, ID.member, 'renamed.pdf');
    expect(renamed.originalName).toBe('renamed.pdf');
  });

  it("a viewer can't manage even a file they uploaded", async () => {
    const file = vaultFile(null, ID.viewer);
    const { s, uploadsService } = vault({ billing: 'passes', file });
    expect(await outcome(() => s.deleteFile(FILE_ID, ID.viewer))).toBe(`403 ${READ_ONLY_MESSAGE}`);
    expect(uploadsService.deleteStoredObject).not.toHaveBeenCalled();
  });

  it('deleting a file the owner can see still works', async () => {
    const file = vaultFile(PUBLIC_FOLDER, ID.member);
    const { s, uploadsService, FileModel } = vault({ billing: 'passes', file });
    await s.deleteFile(FILE_ID, ID.owner);
    expect(uploadsService.deleteStoredObject).toHaveBeenCalledTimes(1);
    expect(FileModel.deleteOne).toHaveBeenCalledTimes(1);
  });
});

describe('where a file can be moved (R53)', () => {
  const move = async (to: string | null, who: Who = 'member') => {
    const file = vaultFile(PUBLIC_FOLDER, ID.member);
    const { s } = vault({ billing: 'passes', file });
    const result = await outcome(() => s.moveFile(FILE_ID, ID[who], to));
    return { result, file };
  };

  it("not into another project's folder", async () => {
    const { result, file } = await move(FOREIGN_FOLDER);
    expect(result).toBe('404 Destination folder not found');
    expect(file.save).not.toHaveBeenCalled();
  });

  it("not into a private folder the mover can't open", async () => {
    const { result, file } = await move(PRIVATE_FOLDER);
    expect(result).toBe('403 You do not have access to this folder');
    expect(file.save).not.toHaveBeenCalled();
    expect(String(file.folderId)).toBe(PUBLIC_FOLDER);
  });

  it('into a private folder shared with the mover', async () => {
    const { result, file } = await move(SHARED_FOLDER);
    expect(result).toBe('done');
    expect(String(file.folderId)).toBe(SHARED_FOLDER);
  });

  it('to the top of the Vault', async () => {
    const { result, file } = await move(null);
    expect(result).toBe('done');
    expect(file.folderId).toBeNull();
  });
});
