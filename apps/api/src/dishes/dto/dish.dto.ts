import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class DishDto {
  @IsString({ message: '先写菜名' })
  @MinLength(1, { message: '先写菜名' })
  @MaxLength(20, { message: '菜名最多 20 字' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80, { message: '简介最多 80 字' })
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: '食材太长了' })
  ingredients?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30, { message: '步骤最多 30 步' })
  @IsString({ each: true })
  @MaxLength(200, { each: true, message: '每一步最多 200 字' })
  steps?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '耗时用分钟' })
  @Min(1, { message: '耗时用分钟' })
  @Max(600, { message: '耗时用分钟' })
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: '份量最多 20 字' })
  servings?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceUrl?: string;
}

export class ImportLinkDto {
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: '只能用小红书或抖音，可以改为自己写' },
  )
  @MaxLength(500, { message: '这条链接太长了' })
  url!: string;
}

export class CoverUploadDto {
  @IsString()
  @MaxLength(8_000_000)
  dataBase64!: string;

  @IsIn(['image/jpeg', 'image/png', 'image/webp', 'image/gif'], {
    message: '图片用 jpg、png、webp 或 gif',
  })
  mime!: string;
}
