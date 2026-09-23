import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SessionDto {
  @IsString()
  @MinLength(16, { message: '身份标识不完整' })
  @MaxLength(80, { message: '身份标识不完整' })
  @Matches(/^[A-Za-z0-9_-]+$/, { message: '身份标识不完整' })
  clientKey!: string;
}
