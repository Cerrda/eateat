import { Injectable } from '@nestjs/common';
import { Prisma, type OrderStatus, type Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const orderSelect = {
  id: true,
  kitchenId: true,
  mealDate: true,
  slot: true,
  note: true,
  status: true,
  message: true,
  actorRole: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  items: {
    orderBy: { sortOrder: 'asc' as const },
    select: {
      id: true,
      dishId: true,
      nameSnapshot: true,
      coverSnapshot: true,
      sortOrder: true,
    },
  },
  record: { select: { id: true, deletedAt: true } },
} satisfies Prisma.MealOrderSelect;

export type OrderRecord = Prisma.MealOrderGetPayload<{ select: typeof orderSelect }>;

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  list(kitchenId: string) {
    return this.prisma.mealOrder.findMany({
      where: { kitchenId },
      select: orderSelect,
    });
  }

  find(kitchenId: string, id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.mealOrder.findFirst({ where: { id, kitchenId }, select: orderSelect });
  }

  findActive(kitchenId: string, mealDate: string, slot: 'BREAKFAST' | 'LUNCH' | 'DINNER') {
    return this.prisma.mealOrder.findFirst({
      where: { kitchenId, mealDate, slot, status: { in: ['PENDING', 'ACCEPTED'] } },
      select: orderSelect,
    });
  }

  create(
    tx: Prisma.TransactionClient,
    input: {
      kitchenId: string;
      mealDate: string;
      slot: 'BREAKFAST' | 'LUNCH' | 'DINNER';
      note: string;
      activeSlotKey: string;
      items: Array<{ dishId: string; nameSnapshot: string; coverSnapshot: string | null }>;
    },
  ) {
    return tx.mealOrder.create({
      data: {
        kitchenId: input.kitchenId,
        mealDate: input.mealDate,
        slot: input.slot,
        note: input.note,
        status: 'PENDING',
        activeSlotKey: input.activeSlotKey,
        items: {
          create: input.items.map((item, index) => ({
            dishId: item.dishId,
            nameSnapshot: item.nameSnapshot,
            coverSnapshot: item.coverSnapshot,
            sortOrder: index,
          })),
        },
      },
      select: orderSelect,
    });
  }

  transition(
    tx: Prisma.TransactionClient,
    id: string,
    from: OrderStatus,
    data: {
      status: OrderStatus;
      message?: string;
      actorRole?: Role | null;
      activeSlotKey?: string | null;
      completedAt?: Date | null;
    },
  ) {
    return tx.mealOrder
      .updateMany({ where: { id, status: from }, data })
      .then((result) => {
        if (result.count !== 1) return null;
        return tx.mealOrder.findFirst({ where: { id }, select: orderSelect });
      });
  }
}
