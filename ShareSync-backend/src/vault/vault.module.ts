import { Module } from '@nestjs/common';
import { ModerationModule } from '../moderation/moderation.module';
import { MongooseModule } from '@nestjs/mongoose';
import { VaultFolder, VaultFolderSchema } from './schemas/vault-folder.schema';
import { VaultFile, VaultFileSchema } from './schemas/vault-file.schema';
import { VaultService } from './vault.service';
import { VaultController } from './vault.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VaultFolder.name, schema: VaultFolderSchema },
      { name: VaultFile.name, schema: VaultFileSchema },
    ]),
    ModerationModule,
    NotificationsModule,
  ],
  controllers: [VaultController],
  providers: [VaultService],
  exports: [VaultService],
})
export class VaultModule {}
