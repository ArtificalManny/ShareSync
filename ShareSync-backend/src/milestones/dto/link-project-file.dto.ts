// src/milestones/dto/link-project-file.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class LinkProjectFileDto {
  @ApiProperty({
    description:
      'Existing project File ID to reference',
  })
  @IsMongoId()
  fileId: string;
}
