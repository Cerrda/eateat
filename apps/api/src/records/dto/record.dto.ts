import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class RecordPhotoDto {
  @IsString()
  @MaxLength(8_000_000)
  dataBase64!: string;

  @IsIn(['image/jpeg', 'image/png', 'image/webp', 'image/gif'], {
    message: '图片用 jpg、png、webp 或 gif',
  })
  mime!: string;
}

export class CreateRecordDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '选一个日期' })
  mealDate!: string;

  @IsIn(['BREAKFAST', 'LUNCH', 'DINNER'], { message: '选早上、中午或晚上' })
  slot!: 'BREAKFAST' | 'LUNCH' | 'DINNER';

  @IsOptional()
  @IsString()
  @MaxLength(300, { message: '文字最多 300 字' })
  body?: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  dishIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(9, { message: '最多 9 张照片' })
  @ValidateNested({ each: true })
  @Type(() => RecordPhotoDto)
  photos?: RecordPhotoDto[];
}

export class UpdateRecordDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '选一个日期' })
  mealDate?: string;

  @IsOptional()
  @IsIn(['BREAKFAST', 'LUNCH', 'DINNER'], { message: '选早上、中午或晚上' })
  slot?: 'BREAKFAST' | 'LUNCH' | 'DINNER';

  @IsOptional()
  @IsString()
  @MaxLength(300, { message: '文字最多 300 字' })
  body?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  dishIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keepPhotoIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(9, { message: '最多 9 张照片' })
  @ValidateNested({ each: true })
  @Type(() => RecordPhotoDto)
  addPhotos?: RecordPhotoDto[];
}
