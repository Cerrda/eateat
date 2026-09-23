import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DishModule } from '../dishes/dish.module.js';
import { KitchenModule } from '../kitchen/kitchen.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { OrderController } from './order.controller.js';
import { OrderRepository } from './order.repository.js';
import { OrderService } from './order.service.js';

@Module({
  imports: [PrismaModule, AuthModule, KitchenModule, DishModule],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository],
  exports: [OrderRepository],
})
export class OrderModule {}
