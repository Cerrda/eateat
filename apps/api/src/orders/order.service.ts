import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { isOrderDate } from '../domain/calendar.js';
import { slotKey, transitionError, type OrderStatusName } from '../domain/order-rules.js';
import { assertShortMessage, graphemeLength } from '../domain/text.js';
import { raise, messageOf } from '../common/http.js';
import type { RequestKitchen } from '../common/request-context.js';
import { DishRepository } from '../dishes/dish.repository.js';
import type { CreateOrderDto } from './dto/order.dto.js';
import { presentOrder, sortForCooker, sortForEater } from './order.presenter.js';
import { OrderRepository, type OrderRecord } from './order.repository.js';

@Injectable()
export class OrderService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly dishes: DishRepository,
  ) {}

  async list(kitchen: RequestKitchen) {
    const rows = await this.orders.list(kitchen.kitchenId);
    const presented = rows.map(presentOrder);
    return {
      orders: kitchen.role === 'COOKER' ? sortForCooker(presented) : sortForEater(presented),
    };
  }

  async get(kitchen: RequestKitchen, id: string) {
    return presentOrder(await this.requireOrder(kitchen.kitchenId, id));
  }

  async active(kitchen: RequestKitchen, mealDate: string, slot: CreateOrderDto['slot']) {
    const order = await this.orders.findActive(kitchen.kitchenId, mealDate, slot);
    return { order: order ? presentOrder(order) : null };
  }

  async create(kitchen: RequestKitchen, dto: CreateOrderDto) {
    if (kitchen.role !== 'EATER') {
      raise(HttpStatus.FORBIDDEN, 'ROLE', '这一边做不了这件事');
    }
    if (!isOrderDate(dto.mealDate)) {
      raise(HttpStatus.BAD_REQUEST, 'DATE', '只能点今天、明天或后天');
    }
    const dishIds = dto.dishIds.map((id) => id.trim()).filter(Boolean);
    if (new Set(dishIds).size !== dishIds.length) {
      raise(HttpStatus.BAD_REQUEST, 'DISH_REPEAT', '同一道菜在这一餐里只加一次');
    }
    const note = (dto.note ?? '').trim();
    if (graphemeLength(note) > 100) {
      raise(HttpStatus.BAD_REQUEST, 'NOTE', '备注最多 100 字');
    }

    const published = await this.dishes.findPublished(kitchen.kitchenId, dishIds);
    if (published.length !== dishIds.length) {
      raise(HttpStatus.BAD_REQUEST, 'DISH', '菜单里没有这道菜');
    }
    const byId = new Map(published.map((dish) => [dish.id, dish]));
    const existing = await this.orders.findActive(kitchen.kitchenId, dto.mealDate, dto.slot);
    if (existing) {
      raise(HttpStatus.CONFLICT, 'SLOT_TAKEN', '这一餐已经点过了', { orderId: existing.id });
    }

    try {
      const created = await this.orders.transaction((tx) =>
        this.orders.create(tx, {
          kitchenId: kitchen.kitchenId,
          mealDate: dto.mealDate,
          slot: dto.slot,
          note,
          activeSlotKey: slotKey(kitchen.kitchenId, dto.mealDate, dto.slot),
          items: dishIds.map((id) => {
            const dish = byId.get(id);
            return {
              dishId: id,
              nameSnapshot: dish?.name ?? '',
              coverSnapshot: dish?.coverPath ?? null,
            };
          }),
        }),
      );
      return presentOrder(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const raced = await this.orders.findActive(kitchen.kitchenId, dto.mealDate, dto.slot);
        raise(HttpStatus.CONFLICT, 'SLOT_TAKEN', '这一餐已经点过了', {
          orderId: raced?.id ?? null,
        });
      }
      throw error;
    }
  }

  accept(kitchen: RequestKitchen, id: string) {
    return this.change(kitchen, id, 'accept');
  }

  reject(kitchen: RequestKitchen, id: string, message: string) {
    return this.change(kitchen, id, 'reject', message);
  }

  complete(kitchen: RequestKitchen, id: string) {
    return this.change(kitchen, id, 'complete');
  }

  cancel(kitchen: RequestKitchen, id: string, message: string) {
    return this.change(kitchen, id, 'cancel', message);
  }

  private async change(
    kitchen: RequestKitchen,
    id: string,
    action: 'accept' | 'reject' | 'complete' | 'cancel',
    rawMessage?: string,
  ) {
    const order = await this.requireOrder(kitchen.kitchenId, id);
    const problem = transitionError(order.status as OrderStatusName, action, kitchen.role);
    if (problem) raise(HttpStatus.CONFLICT, 'ORDER', problem);

    let message = order.message;
    if (action === 'reject' || action === 'cancel') {
      try {
        message = assertShortMessage(rawMessage ?? '', 40);
      } catch (error) {
        raise(HttpStatus.BAD_REQUEST, 'MESSAGE', messageOf(error));
      }
    }

    const nextStatus =
      action === 'accept'
        ? 'ACCEPTED'
        : action === 'reject'
          ? 'REJECTED'
          : action === 'complete'
            ? 'COMPLETED'
            : 'CANCELLED';
    const updated = await this.orders.transaction((tx) =>
      this.orders.transition(tx, id, order.status, {
        status: nextStatus,
        message,
        actorRole: action === 'accept' || action === 'complete' ? 'COOKER' : kitchen.role,
        ...(action === 'accept' ? {} : { activeSlotKey: null }),
        completedAt: action === 'complete' ? new Date() : order.completedAt,
      }),
    );
    if (!updated) raise(HttpStatus.CONFLICT, 'ORDER', '这一餐的状态变了，再看一次');
    return presentOrder(updated);
  }

  private async requireOrder(kitchenId: string, id: string): Promise<OrderRecord> {
    const order = await this.orders.find(kitchenId, id);
    if (!order) raise(HttpStatus.NOT_FOUND, 'ORDER', '没有这一餐');
    return order;
  }
}
