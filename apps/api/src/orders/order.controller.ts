import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentKitchen, type RequestKitchen } from '../common/request-context.js';
import { Roles } from '../kitchen/dto/kitchen.dto.js';
import { KitchenGuard } from '../kitchen/kitchen.guard.js';
import { RoleGuard } from '../kitchen/role.guard.js';
import { ActiveOrderQuery, CreateOrderDto, OrderMessageDto } from './dto/order.dto.js';
import { OrderService } from './order.service.js';

@Controller({ path: 'orders', version: '1' })
@UseGuards(AuthGuard, KitchenGuard, RoleGuard)
export class OrderController {
  constructor(private readonly orders: OrderService) {}

  @Get()
  list(@CurrentKitchen() kitchen: RequestKitchen) {
    return this.orders.list(kitchen);
  }

  @Get('active')
  active(@CurrentKitchen() kitchen: RequestKitchen, @Query() query: ActiveOrderQuery) {
    return this.orders.active(kitchen, query.mealDate, query.slot);
  }

  @Get(':id')
  get(@CurrentKitchen() kitchen: RequestKitchen, @Param('id') id: string) {
    return this.orders.get(kitchen, id);
  }

  @Post()
  @Roles('EATER')
  create(@CurrentKitchen() kitchen: RequestKitchen, @Body() dto: CreateOrderDto) {
    return this.orders.create(kitchen, dto);
  }

  @Post(':id/accept')
  @Roles('COOKER')
  accept(@CurrentKitchen() kitchen: RequestKitchen, @Param('id') id: string) {
    return this.orders.accept(kitchen, id);
  }

  @Post(':id/reject')
  @Roles('COOKER')
  reject(
    @CurrentKitchen() kitchen: RequestKitchen,
    @Param('id') id: string,
    @Body() dto: OrderMessageDto,
  ) {
    return this.orders.reject(kitchen, id, dto.message);
  }

  @Post(':id/complete')
  @Roles('COOKER')
  complete(@CurrentKitchen() kitchen: RequestKitchen, @Param('id') id: string) {
    return this.orders.complete(kitchen, id);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentKitchen() kitchen: RequestKitchen,
    @Param('id') id: string,
    @Body() dto: OrderMessageDto,
  ) {
    return this.orders.cancel(kitchen, id, dto.message);
  }
}
