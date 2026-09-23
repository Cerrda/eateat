import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { KitchenModule } from '../kitchen/kitchen.module.js';
import { MediaModule } from '../media/media.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { DishController } from './dish.controller.js';
import { DishRepository } from './dish.repository.js';
import { DishService } from './dish.service.js';
import { LinkImportService } from './link-import.service.js';

@Module({
  imports: [PrismaModule, AuthModule, KitchenModule, MediaModule],
  controllers: [DishController],
  providers: [DishService, DishRepository, LinkImportService],
  exports: [DishRepository],
})
export class DishModule {}
