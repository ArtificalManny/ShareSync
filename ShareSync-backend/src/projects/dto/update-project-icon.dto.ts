import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateProjectIconDto {
  @IsIn(['emoji', 'svg'], { message: 'kind must be "emoji" or "svg"' })
  kind: 'emoji' | 'svg';

  @IsString()
  @IsNotEmpty()
  value: string;
}
