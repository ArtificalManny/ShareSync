import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

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
}
