import { Injectable, HttpException, HttpStatus, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VaultFolder, VaultFolderDocument } from './schemas/vault-folder.schema';
import { VaultFile, VaultFileDocument } from './schemas/vault-file.schema';

// Standard Free Tier Limit: 5GB (in bytes)
const PROJECT_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; 

@Injectable()
export class VaultService {
  constructor(
    @InjectModel(VaultFolder.name) private folderModel: Model<VaultFolderDocument>,
    @InjectModel(VaultFile.name) private fileModel: Model<VaultFileDocument>,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // STORAGE CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════════

  async checkStorageQuota(projectId: string, incomingFileBytes: number): Promise<void> {
    const projId = new Types.ObjectId(projectId);
    
    // Aggregate total size of all files in this project
    const result = await this.fileModel.aggregate([
      { $match: { projectId: projId } },
      { $group: { _id: null, totalBytes: { $sum: '$sizeInBytes' } } }
    ]);

    const currentUsedBytes = result.length > 0 ? result[0].totalBytes : 0;

    if (currentUsedBytes + incomingFileBytes > PROJECT_STORAGE_LIMIT_BYTES) {
      // HTTP 402 Payment Required -> Triggers frontend upgrade modal
      throw new HttpException({
        message: 'Storage limit exceeded. Please upgrade your plan.',
        currentUsedBytes,
        limitBytes: PROJECT_STORAGE_LIMIT_BYTES
      }, HttpStatus.PAYMENT_REQUIRED);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // FILE & FOLDER OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  async uploadFile(projectId: string, userId: string, file: Express.Multer.File, folderId?: string) {
    // 1. Verify Quota
    await this.checkStorageQuota(projectId, file.size);

    // 2. Mock Cloud Upload (In a real app, you'd push file.buffer to AWS S3 here)
    // For now, we simulate the S3 URL generation
    const mockFileUrl = `https://storage.sharesync.app/${projectId}/${Date.now()}-${file.originalname}`;

    // 3. Save Metadata
    const newFile = new this.fileModel({
      projectId: new Types.ObjectId(projectId),
      folderId: folderId ? new Types.ObjectId(folderId) : null,
      originalName: file.originalname,
      fileUrl: mockFileUrl,
      sizeInBytes: file.size,
      mimeType: file.mimetype,
      uploadedBy: new Types.ObjectId(userId),
    });

    return newFile.save();
  }

  async createFolder(projectId: string, userId: string, name: string, accessLevel: 'public' | 'private', allowedUserIds: string[] = []) {
    const folder = new this.folderModel({
      projectId: new Types.ObjectId(projectId),
      name,
      accessLevel,
      allowedUsers: allowedUserIds.map(id => new Types.ObjectId(id)),
      createdBy: new Types.ObjectId(userId)
    });
    return folder.save();
  }

  async getProjectVault(projectId: string, userId: string) {
    const projId = new Types.ObjectId(projectId);
    const userObjId = new Types.ObjectId(userId);

    // Find all folders, but filter private ones if user isn't allowed
    const allFolders = await this.folderModel.find({ projectId: projId }).exec();
    
    const accessibleFolders = allFolders.filter(folder => {
      if (folder.accessLevel === 'public') return true;
      if (folder.createdBy.equals(userObjId)) return true;
      // Note: Add logic here later to allow Project Moderators to see everything
      return folder.allowedUsers.some(u => u.equals(userObjId));
    });

    // Find all files in the project
    const allFiles = await this.fileModel
      .find({ projectId: projId })
      .populate('uploadedBy', 'firstName lastName avatar')
      .exec();

    // Filter files to only show those in accessible folders (or root)
    const accessibleFolderIds = accessibleFolders.map(f => f._id.toString());
    const accessibleFiles = allFiles.filter(file => {
      if (!file.folderId) return true; // It's in the root
      return accessibleFolderIds.includes(file.folderId.toString());
    });

    // Get current usage stats for the UI progress bar
    const result = await this.fileModel.aggregate([
      { $match: { projectId: projId } },
      { $group: { _id: null, totalBytes: { $sum: '$sizeInBytes' } } }
    ]);
    const storageUsedBytes = result.length > 0 ? result[0].totalBytes : 0;

    return {
      folders: accessibleFolders,
      files: accessibleFiles,
      storage: {
        usedBytes: storageUsedBytes,
        limitBytes: PROJECT_STORAGE_LIMIT_BYTES
      }
    };
  }
}
