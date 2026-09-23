import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../role.guard.js';
import type { AppRole } from '../kitchen.constants.js';

export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);

export class CreateKitchenDto {
  @IsIn(['COOKER', 'EATER'], { message: '先选我来做饭，或我来点餐' })
  role!: 'COOKER' | 'EATER';
}

export class JoinDto {
  @IsOptional()
  @IsBoolean()
  abandon?: boolean;
}

export class RenameDto {
  @IsString()
  @MinLength(1, { message: '称呼要在 2 到 8 个字' })
  @MaxLength(8, { message: '称呼要在 2 到 8 个字' })
  displayName!: string;
}

export class SeenDto {
  @IsIn(['orders', 'records'], { message: '没有这一页' })
  surface!: 'orders' | 'records';
}
