import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '只能点今天、明天或后天' })
  mealDate!: string;

  @IsIn(['BREAKFAST', 'LUNCH', 'DINNER'], { message: '先选早上、中午或晚上' })
  slot!: 'BREAKFAST' | 'LUNCH' | 'DINNER';

  @IsArray()
  @ArrayMinSize(1, { message: '先选一道菜' })
  @ArrayMaxSize(6, { message: '一餐最多 6 道菜' })
  @IsString({ each: true })
  dishIds!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '备注最多 100 字' })
  note?: string;
}

export class OrderMessageDto {
  @IsString()
  @MaxLength(40, { message: '留一句话，最多 40 个字' })
  message!: string;
}

export class ActiveOrderQuery {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '只能点今天、明天或后天' })
  mealDate!: string;

  @IsIn(['BREAKFAST', 'LUNCH', 'DINNER'], { message: '先选早上、中午或晚上' })
  slot!: 'BREAKFAST' | 'LUNCH' | 'DINNER';
}
