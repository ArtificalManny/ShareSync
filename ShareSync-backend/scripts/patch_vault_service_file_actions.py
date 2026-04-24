from pathlib import Path
import sys

ROOT = Path.cwd()
VAULT_SERVICE = ROOT / "src/vault/vault.service.ts"

METHODS_TO_INSERT = r"""
  private toObjectId(value: string, label: string): Types.ObjectId {
    if (!value || !Types.ObjectId.isValid(value)) {
      throw new NotFoundException(`${label} not found`);
    }

    return new Types.ObjectId(value);
  }

  private normalizeId(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (value instanceof Types.ObjectId) return value.toString();
    if (value?._id) return this.normalizeId(value._id);
    if (value?.userId) return this.normalizeId(value.userId);
    return value.toString?.() || '';
  }

  private async findVaultFileOrThrow(fileId: string): Promise<VaultFileDocument> {
    const fileObjectId = this.toObjectId(fileId, 'File');

    const file = await this.fileModel.findById(fileObjectId).exec();

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  private async assertCanManageFile(file: VaultFileDocument, userId: string): Promise<void> {
    const userObjectId = this.toObjectId(userId, 'User');
    const userIdString = userObjectId.toString();

    const uploadedById = this.normalizeId((file as any).uploadedBy);

    if (uploadedById === userIdString) {
      return;
    }

    const projectId = this.normalizeId((file as any).projectId);

    if (!projectId || !Types.ObjectId.isValid(projectId)) {
      throw new ForbiddenException('You do not have permission to manage this file');
    }

    const projectDoc = await this.fileModel.db
      .collection('projects')
      .findOne({ _id: new Types.ObjectId(projectId) });

    if (!projectDoc) {
      throw new ForbiddenException('You do not have permission to manage this file');
    }

    const ownerId = this.normalizeId(projectDoc.ownerId || projectDoc.owner);

    if (ownerId === userIdString) {
      return;
    }

    const members = Array.isArray(projectDoc.members) ? projectDoc.members : [];
    const manageableRoles = new Set(['owner', 'admin', 'moderator', 'manager']);

    const matchingMember = members.find((member: any) => {
      const memberUserId = this.normalizeId(
        member?.userId ||
        member?.user ||
        member?._id ||
        member?.id
      );

      return memberUserId === userIdString;
    });

    const role = String(matchingMember?.role || '').toLowerCase();

    if (manageableRoles.has(role)) {
      return;
    }

    throw new ForbiddenException('You do not have permission to manage this file');
  }

  private validateVaultFileName(originalName: string): string {
    const cleaned = String(originalName || '').trim();

    if (!cleaned) {
      throw new HttpException(
        { message: 'File name is required' },
        HttpStatus.BAD_REQUEST
      );
    }

    if (cleaned.length > 180) {
      throw new HttpException(
        { message: 'File name is too long' },
        HttpStatus.BAD_REQUEST
      );
    }

    if (cleaned.includes('/') || cleaned.includes('\\\\') || cleaned.includes('\\0')) {
      throw new HttpException(
        { message: 'File name cannot contain path characters' },
        HttpStatus.BAD_REQUEST
      );
    }

    return cleaned;
  }

  private async removeLocalUploadIfSafe(fileUrl: string): Promise<void> {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
      return;
    }

    const fileName = path.basename(fileUrl);

    if (!fileName || fileName === '.' || fileName === '..') {
      return;
    }

    const absolutePath = path.resolve(process.cwd(), 'uploads', fileName);

    try {
      await fs.unlink(absolutePath);
    } catch (err: any) {
      if (err?.code !== 'ENOENT') {
        this.logger.warn(`Could not remove local vault upload ${absolutePath}: ${err?.message || err}`);
      }
    }
  }

  async renameFile(fileId: string, userId: string, originalName: string): Promise<VaultFileDocument> {
    const file = await this.findVaultFileOrThrow(fileId);
    await this.assertCanManageFile(file, userId);

    file.originalName = this.validateVaultFileName(originalName);

    const saved = await file.save();

    this.eventEmitter.emit('vault.file.renamed', {
      fileId: this.normalizeId((saved as any)._id),
      projectId: this.normalizeId((saved as any).projectId),
      userId,
      originalName: saved.originalName,
    });

    return saved;
  }

  async moveFile(fileId: string, userId: string, folderId?: string | null): Promise<VaultFileDocument> {
    const file = await this.findVaultFileOrThrow(fileId);
    await this.assertCanManageFile(file, userId);

    if (folderId) {
      const folderObjectId = this.toObjectId(folderId, 'Folder');
      const targetFolder = await this.folderModel.findById(folderObjectId).exec();

      if (!targetFolder) {
        throw new NotFoundException('Destination folder not found');
      }

      const fileProjectId = this.normalizeId((file as any).projectId);
      const folderProjectId = this.normalizeId((targetFolder as any).projectId);

      if (fileProjectId !== folderProjectId) {
        throw new ForbiddenException('Cannot move file into a folder from another project');
      }

      file.folderId = folderObjectId;
    } else {
      file.folderId = null as any;
    }

    const saved = await file.save();

    this.eventEmitter.emit('vault.file.moved', {
      fileId: this.normalizeId((saved as any)._id),
      projectId: this.normalizeId((saved as any).projectId),
      userId,
      folderId: saved.folderId ? this.normalizeId(saved.folderId) : null,
    });

    return saved;
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.findVaultFileOrThrow(fileId);
    await this.assertCanManageFile(file, userId);

    const fileUrl = String((file as any).fileUrl || '');
    const projectId = this.normalizeId((file as any).projectId);
    const originalName = String((file as any).originalName || 'File');

    await this.fileModel.deleteOne({ _id: (file as any)._id }).exec();
    await this.removeLocalUploadIfSafe(fileUrl);

    this.eventEmitter.emit('vault.file.deleted', {
      fileId,
      projectId,
      userId,
      originalName,
    });

    this.logger.log(`Vault file deleted: ${fileId}`);
  }
"""

def fail(message):
    print(f"\n[patch_vault_service_file_actions] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[patch_vault_service_file_actions] starting")

    if not VAULT_SERVICE.exists():
        fail(f"Could not find {VAULT_SERVICE}")

    source = VAULT_SERVICE.read_text(encoding="utf-8")
    original = source

    if "async renameFile(" in source and "async moveFile(" in source and "async deleteFile(" in source:
        print("[patch_vault_service_file_actions] file action methods already appear to exist")
        return

    if "import { Injectable, HttpException, HttpStatus, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';" not in source:
        fail("Could not find expected @nestjs/common import. No changes were written.")

    if "import * as fs from 'node:fs/promises';" not in source:
        mongoose_import = "import { Model, Types } from 'mongoose';\n"

        if mongoose_import not in source:
            fail("Could not find mongoose import anchor. No changes were written.")

        source = source.replace(
            mongoose_import,
            mongoose_import + "import * as fs from 'node:fs/promises';\nimport * as path from 'node:path';\n",
            1
        )
        print("[patch_vault_service_file_actions] added fs/path imports")
    else:
        print("[patch_vault_service_file_actions] fs/path imports already appear present")

    final_class_close = source.rfind("\n}")
    if final_class_close == -1:
        fail("Could not find final class closing brace. No changes were written.")

    source = source[:final_class_close] + METHODS_TO_INSERT + source[final_class_close:]

    required_markers = [
        "async renameFile(",
        "async moveFile(",
        "async deleteFile(",
        "private async assertCanManageFile(",
        "private async removeLocalUploadIfSafe(",
        "import * as fs from 'node:fs/promises';",
        "import * as path from 'node:path';",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    backup = VAULT_SERVICE.with_suffix(VAULT_SERVICE.suffix + ".bak-file-actions")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[patch_vault_service_file_actions] backup created: {backup}")

    VAULT_SERVICE.write_text(source, encoding="utf-8")
    print(f"[patch_vault_service_file_actions] patched: {VAULT_SERVICE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"renameFile|moveFile|deleteFile|assertCanManageFile|removeLocalUploadIfSafe|node:fs|node:path\" src/vault/vault.service.ts")
    print("  git diff -- src/vault/vault.service.ts")

if __name__ == "__main__":
    main()
