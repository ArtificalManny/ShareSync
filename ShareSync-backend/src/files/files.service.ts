// src/files/files.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// FILES SERVICE: Vault file management
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { File, FileDocument, FileType, FileStatus } from './schemas/file.schema';
import { Folder, FolderDocument } from './schemas/folder.schema';
import {
  CreateFileDto,
  UpdateFileDto,
  CreateFolderDto,
  UpdateFolderDto,
  FileQueryDto,
  UploadNewVersionDto,
} from './dto/file.dto';
import { ActivitiesService } from '../activities/activities.service';
import { UploadsService } from '../uploads/uploads.service';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectModel(File.name)
    private readonly fileModel: Model<FileDocument>,
    @InjectModel(Folder.name)
    private readonly folderModel: Model<FolderDocument>,
    private readonly eventEmitter: EventEmitter2,
    private readonly activities: ActivitiesService,
    private readonly uploadsService: UploadsService,
  ) {}

  private async recordFileActivity(data: {
    userId: string;
    projectId: string;
    type: string;
    entityId: string;
    action: string;
    fileName: string;
    fileSize?: number;
    version?: number;
  }): Promise<void> {
    try {
      const activity = await this.activities.record({
        userId: data.userId,
        projectId: data.projectId,
        type: data.type,
        entityType: 'file',
        entityId: data.entityId,
        action: data.action,
        details: {
          fileName: data.fileName,
          fileSize: data.fileSize ?? 0,
          version: data.version,
        },
        metadata: {
          fileName: data.fileName,
          fileSize: data.fileSize ?? 0,
        },
        payload: {
          source: 'files',
          projectId: data.projectId,
          fileId: data.entityId,
          version: data.version,
        },
      });

      const event = (activity as any)?.toObject?.() || activity;
      this.eventEmitter.emit('activityCreated', event);
      this.eventEmitter.emit('activity:created', event);
      this.eventEmitter.emit('activity.created', event);
    } catch (error: any) {
      this.logger.warn(
        `File activity logging failed (${data.type}): ${error?.message || error}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FILE CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  async createFile(userId: string, dto: CreateFileDto): Promise<FileDocument> {
    // Validate folder if provided
    if (dto.folderId) {
      const folder = await this.folderModel.findById(dto.folderId);
      if (!folder) {
        throw new BadRequestException('Folder not found');
      }
    }

    // Detect file type from extension if not provided
    const extension = dto.originalName.split('.').pop()?.toLowerCase();

    const file = new this.fileModel({
      ...dto,
      projectId: new Types.ObjectId(dto.projectId),
      folderId: dto.folderId ? new Types.ObjectId(dto.folderId) : undefined,
      linkedTaskId: dto.linkedTaskId ? new Types.ObjectId(dto.linkedTaskId) : undefined,
      uploadedBy: new Types.ObjectId(userId),
      extension,
      status: FileStatus.READY,
      versions: [
        {
          version: 1,
          url: dto.url,
          size: dto.size,
          uploadedBy: new Types.ObjectId(userId),
          uploadedAt: new Date(),
        },
      ],
    });

    const saved = await file.save();

    // Update folder counts
    if (dto.folderId) {
      await this.updateFolderCounts(dto.folderId);
    }

    this.eventEmitter.emit('file.uploaded', {
      fileId: saved._id,
      projectId: dto.projectId,
      uploadedBy: userId,
      fileName: saved.name,
      fileSize: saved.size,
    });

    await this.recordFileActivity({
      userId,
      projectId: dto.projectId,
      type: 'file_uploaded',
      entityId: String(saved._id),
      action: 'file_uploaded',
      fileName: String(saved.name || dto.originalName || 'File'),
      fileSize: Number(saved.size || dto.size || 0),
      version: 1,
    });

    this.logger.log(`File uploaded: ${saved.name}`);

    return saved;
  }

  async findById(fileId: string): Promise<FileDocument> {
    const file = await this.fileModel
      .findById(fileId)
      .populate('uploadedBy', 'firstName lastName avatar')
      .populate('linkedTaskId', 'title');

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async findByProject(
    projectId: string,
    query: FileQueryDto = {},
  ): Promise<{ files: FileDocument[]; total: number }> {
    const filter: any = {
      projectId: new Types.ObjectId(projectId),
      status: { $ne: FileStatus.DELETED },
    };

    if (query.folderId) {
      filter.folderId = new Types.ObjectId(query.folderId);
    } else if (query.folderId === null || query.folderId === 'root') {
      filter.folderId = { $exists: false };
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.starredOnly) {
      filter.isStarred = true;
    }

    if (!query.includeArchived) {
      filter.isArchived = false;
    }

    const normalizedSearch = String(
      query.search || '',
    ).trim();

    if (normalizedSearch) {
      const escapedSearch =
        normalizedSearch.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&',
        );

      const searchPattern =
        new RegExp(
          escapedSearch,
          'i',
        );

      filter.$or = [
        { name: searchPattern },
        { originalName: searchPattern },
        { description: searchPattern },
        { mimeType: searchPattern },
        { fileType: searchPattern },
        { extension: searchPattern },
        { tags: searchPattern },
      ];
    }

    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const offset = query.offset ? parseInt(query.offset, 10) : 0;

    const [files, total] = await Promise.all([
      this.fileModel
        .find(filter)
        .populate('uploadedBy', 'firstName lastName avatar')
        .sort({ [sortField]: sortOrder })
        .skip(offset)
        .limit(limit),
      this.fileModel.countDocuments(filter),
    ]);

    return { files, total };
  }

  async update(fileId: string, dto: UpdateFileDto): Promise<FileDocument> {
    const file = await this.findById(fileId);
    const oldFolderId = file.folderId?.toString();

    Object.assign(file, {
      ...dto,
      folderId: dto.folderId ? new Types.ObjectId(dto.folderId) : file.folderId,
      linkedTaskId: dto.linkedTaskId ? new Types.ObjectId(dto.linkedTaskId) : file.linkedTaskId,
    });

    const saved = await file.save();

    // Update folder counts if moved
    if (oldFolderId !== dto.folderId) {
      if (oldFolderId) await this.updateFolderCounts(oldFolderId);
      if (dto.folderId) await this.updateFolderCounts(dto.folderId);
    }

    return saved;
  }

  async moveFile(fileId: string, targetFolderId: string | null): Promise<FileDocument> {
    const file = await this.findById(fileId);
    const oldFolderId = file.folderId?.toString();

    if (targetFolderId) {
      const targetFolder = await this.folderModel.findById(targetFolderId);
      if (!targetFolder) {
        throw new BadRequestException('Target folder not found');
      }
      file.folderId = new Types.ObjectId(targetFolderId);
    } else {
      file.folderId = undefined;
    }

    const saved = await file.save();

    // Update folder counts
    if (oldFolderId) await this.updateFolderCounts(oldFolderId);
    if (targetFolderId) await this.updateFolderCounts(targetFolderId);

    return saved;
  }

  async delete(fileId: string): Promise<void> {
    const file = await this.findById(fileId);
    
    // Soft delete
    file.status = FileStatus.DELETED;
    await file.save();

    // Update folder counts
    if (file.folderId) {
      await this.updateFolderCounts(file.folderId.toString());
    }

    this.logger.log(`File deleted: ${file.name}`);
  }

  async permanentDelete(fileId: string): Promise<void> {
    const file = await this.fileModel.findById(fileId);
    if (!file) return;

    // Delete physical storage before discarding the metadata required to
    // locate it. Real storage failures are fail-closed.
    await this.uploadsService.deleteStoredObject({
      url: (file as any).url,
      storageKey: (file as any).storageKey,
      storageProvider: (file as any).storageProvider,
    });

    if (
      (file as any).thumbnailUrl &&
      (file as any).thumbnailUrl !== (file as any).url
    ) {
      await this.uploadsService.deleteStoredObject({
        url: (file as any).thumbnailUrl,
      });
    }

    for (const version of (file as any).versions || []) {
      if (version?.url) {
        await this.uploadsService.deleteStoredObject({
          url: version.url,
        });
      }
    }

    await this.fileModel.findByIdAndDelete(fileId);

    if (file.folderId) {
      await this.updateFolderCounts(file.folderId.toString());
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VERSIONING
  // ─────────────────────────────────────────────────────────────────────────────

  async uploadNewVersion(
    fileId: string,
    userId: string,
    dto: UploadNewVersionDto,
  ): Promise<FileDocument> {
    const file = await this.findById(fileId);

    const newVersion = file.currentVersion + 1;

    file.versions.push({
      version: newVersion,
      url: dto.url,
      size: dto.size,
      uploadedBy: new Types.ObjectId(userId),
      uploadedAt: new Date(),
      changelog: dto.changelog,
    });

    file.currentVersion = newVersion;
    file.url = dto.url;
    file.size = dto.size;
    file.storageKey = dto.storageKey;

    const saved = await file.save();

    this.eventEmitter.emit('file.version.uploaded', {
      fileId: saved._id,
      version: newVersion,
      uploadedBy: userId,
    });

    await this.recordFileActivity({
      userId,
      projectId: String(saved.projectId),
      type: 'file_version_uploaded',
      entityId: String(saved._id),
      action: 'file_uploaded',
      fileName: String(saved.name || 'File'),
      fileSize: Number(saved.size || dto.size || 0),
      version: newVersion,
    });

    return saved;
  }

  async getVersions(fileId: string): Promise<FileDocument['versions']> {
    const file = await this.findById(fileId);
    return file.versions;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STARRING
  // ─────────────────────────────────────────────────────────────────────────────

  async toggleStar(fileId: string, userId: string): Promise<{ isStarred: boolean }> {
    const file = await this.findById(fileId);
    const userObjectId = new Types.ObjectId(userId);

    const isCurrentlyStarred = file.starredBy.some(
      (id) => id.toString() === userId,
    );

    if (isCurrentlyStarred) {
      file.starredBy = file.starredBy.filter((id) => id.toString() !== userId);
      file.isStarred = file.starredBy.length > 0;
    } else {
      file.starredBy.push(userObjectId);
      file.isStarred = true;
    }

    await file.save();

    return { isStarred: !isCurrentlyStarred };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ARCHIVE
  // ─────────────────────────────────────────────────────────────────────────────

  async archive(fileId: string): Promise<FileDocument> {
    const file = await this.findById(fileId);
    file.isArchived = true;
    return file.save();
  }

  async unarchive(fileId: string): Promise<FileDocument> {
    const file = await this.findById(fileId);
    file.isArchived = false;
    return file.save();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DOWNLOAD TRACKING
  // ─────────────────────────────────────────────────────────────────────────────

  async incrementDownloadCount(fileId: string): Promise<void> {
    await this.fileModel.updateOne(
      { _id: new Types.ObjectId(fileId) },
      { $inc: { downloadCount: 1 } },
    );
  }

  async incrementViewCount(fileId: string): Promise<void> {
    await this.fileModel.updateOne(
      { _id: new Types.ObjectId(fileId) },
      { $inc: { viewCount: 1 } },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FOLDER CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  async createFolder(userId: string, dto: CreateFolderDto): Promise<FolderDocument> {
    // Check for duplicate name in same parent
    const existing = await this.folderModel.findOne({
      projectId: new Types.ObjectId(dto.projectId),
      parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : { $exists: false },
      name: dto.name,
    });

    if (existing) {
      throw new BadRequestException('Folder with this name already exists');
    }

    // Build path
    let path = '/';
    if (dto.parentId) {
      const parent = await this.folderModel.findById(dto.parentId);
      if (!parent) {
        throw new BadRequestException('Parent folder not found');
      }
      path = `${parent.path}${parent.name}/`;
    }

    const folder = new this.folderModel({
      ...dto,
      projectId: new Types.ObjectId(dto.projectId),
      parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : undefined,
      path,
      createdBy: new Types.ObjectId(userId),
    });

    const saved = await folder.save();

    // Update parent folder counts
    if (dto.parentId) {
      await this.updateFolderCounts(dto.parentId);
    }

    return saved;
  }

  async findFolderById(folderId: string): Promise<FolderDocument> {
    const folder = await this.folderModel
      .findById(folderId)
      .populate('createdBy', 'firstName lastName');

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return folder;
  }

  async findFoldersByProject(
    projectId: string,
    parentId?: string,
  ): Promise<FolderDocument[]> {
    const filter: any = {
      projectId: new Types.ObjectId(projectId),
      isArchived: false,
    };

    if (parentId) {
      filter.parentId = new Types.ObjectId(parentId);
    } else {
      filter.parentId = { $exists: false };
    }

    return this.folderModel.find(filter).sort({ name: 1 });
  }

  async updateFolder(folderId: string, dto: UpdateFolderDto): Promise<FolderDocument> {
    const folder = await this.findFolderById(folderId);

    if (dto.name && dto.name !== folder.name) {
      // Check for duplicate
      const existing = await this.folderModel.findOne({
        projectId: folder.projectId,
        parentId: folder.parentId,
        name: dto.name,
        _id: { $ne: folder._id },
      });

      if (existing) {
        throw new BadRequestException('Folder with this name already exists');
      }
    }

    Object.assign(folder, dto);
    return folder.save();
  }

  async moveFolder(folderId: string, targetParentId: string | null): Promise<FolderDocument> {
    const folder = await this.findFolderById(folderId);
    const oldParentId = folder.parentId?.toString();

    // Prevent moving folder into itself or its children
    if (targetParentId) {
      const targetFolder = await this.folderModel.findById(targetParentId);
      if (!targetFolder) {
        throw new BadRequestException('Target folder not found');
      }
      if (targetFolder.path.includes(`${folder.path}${folder.name}/`)) {
        throw new BadRequestException('Cannot move folder into its own subfolder');
      }
      folder.parentId = new Types.ObjectId(targetParentId);
      folder.path = `${targetFolder.path}${targetFolder.name}/`;
    } else {
      folder.parentId = undefined;
      folder.path = '/';
    }

    const saved = await folder.save();

    // Update all subfolders' paths
    await this.updateSubfolderPaths(folder._id.toString(), folder.path + folder.name + '/');

    // Update parent folder counts
    if (oldParentId) await this.updateFolderCounts(oldParentId);
    if (targetParentId) await this.updateFolderCounts(targetParentId);

    return saved;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const folder = await this.findFolderById(folderId);

    // Check if folder has contents
    const hasFiles = await this.fileModel.countDocuments({ folderId: folder._id });
    const hasSubfolders = await this.folderModel.countDocuments({ parentId: folder._id });

    if (hasFiles > 0 || hasSubfolders > 0) {
      throw new BadRequestException(
        'Cannot delete folder with contents. Move or delete contents first.',
      );
    }

    await this.folderModel.findByIdAndDelete(folderId);

    if (folder.parentId) {
      await this.updateFolderCounts(folder.parentId.toString());
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FOLDER CONTENTS
  // ─────────────────────────────────────────────────────────────────────────────

  async getFolderContents(
    projectId: string,
    folderId?: string,
  ): Promise<{
    folder: FolderDocument | null;
    subfolders: FolderDocument[];
    files: FileDocument[];
    breadcrumbs: { id: string; name: string }[];
    totalSize: number;
  }> {
    let folder: FolderDocument | null = null;
    let breadcrumbs: { id: string; name: string }[] = [];

    if (folderId) {
      folder = await this.findFolderById(folderId);
      breadcrumbs = await this.buildBreadcrumbs(folder);
    }

    const [subfolders, filesResult] = await Promise.all([
      this.findFoldersByProject(projectId, folderId),
      this.findByProject(projectId, { folderId: folderId || 'root' }),
    ]);

    const totalSize = filesResult.files.reduce((sum, f) => sum + f.size, 0);

    return {
      folder,
      subfolders,
      files: filesResult.files,
      breadcrumbs,
      totalSize,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private async updateFolderCounts(folderId: string): Promise<void> {
    const [fileCount, folderCount, sizeAgg] = await Promise.all([
      this.fileModel.countDocuments({
        folderId: new Types.ObjectId(folderId),
        status: { $ne: FileStatus.DELETED },
      }),
      this.folderModel.countDocuments({
        parentId: new Types.ObjectId(folderId),
        isArchived: false,
      }),
      this.fileModel.aggregate([
        {
          $match: {
            folderId: new Types.ObjectId(folderId),
            status: { $ne: FileStatus.DELETED },
          },
        },
        { $group: { _id: null, total: { $sum: '$size' } } },
      ]),
    ]);

    await this.folderModel.updateOne(
      { _id: new Types.ObjectId(folderId) },
      {
        fileCount,
        folderCount,
        totalSize: sizeAgg[0]?.total || 0,
      },
    );
  }

  private async updateSubfolderPaths(parentId: string, newParentPath: string): Promise<void> {
    const subfolders = await this.folderModel.find({ parentId: new Types.ObjectId(parentId) });

    for (const subfolder of subfolders) {
      subfolder.path = newParentPath;
      await subfolder.save();
      await this.updateSubfolderPaths(subfolder._id.toString(), `${newParentPath}${subfolder.name}/`);
    }
  }

  private async buildBreadcrumbs(folder: FolderDocument): Promise<{ id: string; name: string }[]> {
    const breadcrumbs: { id: string; name: string }[] = [];
    let current: FolderDocument | null = folder;

    while (current) {
      breadcrumbs.unshift({ id: current._id.toString(), name: current.name });
      if (current.parentId) {
        current = await this.folderModel.findById(current.parentId);
      } else {
        current = null;
      }
    }

    return breadcrumbs;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FILE TYPE DETECTION
  // ─────────────────────────────────────────────────────────────────────────────

  static detectFileType(mimeType: string, extension?: string): FileType {
    if (mimeType.startsWith('image/')) return FileType.IMAGE;
    if (mimeType.startsWith('video/')) return FileType.VIDEO;
    if (mimeType.startsWith('audio/')) return FileType.AUDIO;
    if (mimeType === 'application/pdf') return FileType.PDF;
    
    if (
      mimeType.includes('spreadsheet') ||
      mimeType.includes('excel') ||
      extension === 'xlsx' ||
      extension === 'xls' ||
      extension === 'csv'
    ) {
      return FileType.SPREADSHEET;
    }

    if (
      mimeType.includes('presentation') ||
      mimeType.includes('powerpoint') ||
      extension === 'pptx' ||
      extension === 'ppt'
    ) {
      return FileType.PRESENTATION;
    }

    if (
      mimeType.includes('word') ||
      mimeType.includes('document') ||
      extension === 'docx' ||
      extension === 'doc'
    ) {
      return FileType.DOCUMENT;
    }

    if (
      mimeType.startsWith('text/') ||
      mimeType === 'application/json' ||
      mimeType === 'application/javascript' ||
      mimeType === 'application/xml' ||
      ['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'java', 'go', 'rs', 'c', 'cpp', 'h'].includes(
        extension || '',
      )
    ) {
      return FileType.CODE;
    }

    if (
      mimeType.includes('zip') ||
      mimeType.includes('tar') ||
      mimeType.includes('rar') ||
      mimeType.includes('7z') ||
      mimeType.includes('gzip')
    ) {
      return FileType.ARCHIVE;
    }

    return FileType.OTHER;
  }
}
