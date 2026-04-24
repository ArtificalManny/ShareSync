from pathlib import Path
import sys

ROOT = Path.cwd()
VAULT_CONTROLLER = ROOT / "src/vault/vault.controller.ts"

METHODS_TO_INSERT = r"""
  @Patch('files/:fileId')
  @UseInterceptors(TextModerationInterceptor)
  async renameFile(
    @Req() req: any,
    @Param('fileId') fileId: string,
    @Body('originalName') originalName?: string,
    @Body('name') name?: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    if (!fileId) {
      throw new BadRequestException('File ID is required');
    }

    const nextName = originalName || name;

    if (!nextName) {
      throw new BadRequestException('File name is required');
    }

    const file = await this.vaultService.renameFile(fileId, userId, nextName);

    return {
      success: true,
      data: file,
      message: 'File renamed',
    };
  }

  @Patch('files/:fileId/move')
  async moveFile(
    @Req() req: any,
    @Param('fileId') fileId: string,
    @Body('folderId') folderId?: string | null,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    if (!fileId) {
      throw new BadRequestException('File ID is required');
    }

    const file = await this.vaultService.moveFile(fileId, userId, folderId || null);

    return {
      success: true,
      data: file,
      message: 'File moved',
    };
  }

  @Delete('files/:fileId')
  async deleteFile(
    @Req() req: any,
    @Param('fileId') fileId: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    if (!fileId) {
      throw new BadRequestException('File ID is required');
    }

    await this.vaultService.deleteFile(fileId, userId);

    return {
      success: true,
      message: 'File deleted',
    };
  }
"""

def fail(message):
    print(f"\n[patch_vault_controller_file_actions] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[patch_vault_controller_file_actions] starting")

    if not VAULT_CONTROLLER.exists():
        fail(f"Could not find {VAULT_CONTROLLER}")

    source = VAULT_CONTROLLER.read_text(encoding="utf-8")
    original = source

    if "@Patch('files/:fileId')" in source and "@Patch('files/:fileId/move')" in source and "@Delete('files/:fileId')" in source:
        print("[patch_vault_controller_file_actions] file action routes already appear to exist")
        return

    old_import = """import {
  Controller, Get, Post, Body, Param, Req, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException
} from '@nestjs/common';"""

    new_import = """import {
  Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException
} from '@nestjs/common';"""

    if old_import in source:
        source = source.replace(old_import, new_import, 1)
        print("[patch_vault_controller_file_actions] added Patch/Delete imports")
    elif "Patch" in source and "Delete" in source:
        print("[patch_vault_controller_file_actions] Patch/Delete imports already appear present")
    else:
        fail("Could not find expected @nestjs/common import block. No changes were written.")

    final_class_close = source.rfind("\n}")
    if final_class_close == -1:
        fail("Could not find final class closing brace. No changes were written.")

    source = source[:final_class_close] + METHODS_TO_INSERT + source[final_class_close:]

    required_markers = [
        "@Patch('files/:fileId')",
        "@Patch('files/:fileId/move')",
        "@Delete('files/:fileId')",
        "this.vaultService.renameFile(",
        "this.vaultService.moveFile(",
        "this.vaultService.deleteFile(",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    backup = VAULT_CONTROLLER.with_suffix(VAULT_CONTROLLER.suffix + ".bak-file-action-routes")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[patch_vault_controller_file_actions] backup created: {backup}")

    VAULT_CONTROLLER.write_text(source, encoding="utf-8")
    print(f"[patch_vault_controller_file_actions] patched: {VAULT_CONTROLLER}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"Patch|Delete|renameFile|moveFile|deleteFile|files/:fileId\" src/vault/vault.controller.ts")
    print("  git diff -- src/vault/vault.controller.ts")

if __name__ == "__main__":
    main()
