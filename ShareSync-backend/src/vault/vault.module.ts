import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VaultFolder, VaultFolderSchema } from './schemas/vault-folder.schema';
import { VaultFile, VaultFileSchema } from './schemas/vault-file.schema';
import { VaultService } from './vault.service';
import { VaultController } from './vault.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VaultFolder.name, schema: VaultFolderSchema },
      { name: VaultFile.name, schema: VaultFileSchema },
    ])
  ],
  controllers: [VaultController],
  providers: [VaultService],
  exports: [VaultService],
})
export class VaultModule {}
