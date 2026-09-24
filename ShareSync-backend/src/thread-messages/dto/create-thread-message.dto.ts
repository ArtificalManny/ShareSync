import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  SendMessageAttachmentDto,
} from '../../messages/dto/message.dto';

// team-room-secure-message-pipeline-v1
export class CreateThreadMessageDto {
  @ApiProperty({ description: 'Message content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Mentioned user IDs',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

  @ApiPropertyOptional({
    description:
      'Existing project File ID to reference',
    type: [String],
    maxItems: 1,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1)
  fileReferences?: Array<
    string | { fileId?: string }
  >;

  @ApiPropertyOptional({
    description:
      'Moderated and server-authorized Team Room image attachments',
    type: [SendMessageAttachmentDto],
    maxItems: 5,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({
    each: true,
  })
  @Type(
    () =>
      SendMessageAttachmentDto,
  )
  attachments?:
    SendMessageAttachmentDto[];
}
