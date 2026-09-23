import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DishModule } from '../dishes/dish.module.js';
import { KitchenModule } from '../kitchen/kitchen.module.js';
import { MediaModule } from '../media/media.module.js';
import { OrderModule } from '../orders/order.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RecordController } from './record.controller.js';
import { RecordRepository } from './record.repository.js';
import { RecordService } from './record.service.js';

@Module({
  imports: [PrismaModule, AuthModule, KitchenModule, DishModule, OrderModule, MediaModule],
  controllers: [RecordController],
  providers: [RecordService, RecordRepository],
})
export class RecordModule {}
