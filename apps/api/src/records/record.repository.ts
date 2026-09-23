import { Injectable } from '@nestjs/common';
import { Prisma, type MealSlot } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const recordSelect = {
  id: true,
  kitchenId: true,
  orderId: true,
  mealDate: true,
  slot: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  photos: {
    orderBy: { sortOrder: 'asc' as const },
    select: { id: true, path: true, sortOrder: true },
  },
  dishes: {
    select: { id: true, dishId: true, nameSnapshot: true },
  },
} satisfies Prisma.MealRecordSelect;

export type RecordRow = Prisma.MealRecordGetPayload<{ select: typeof recordSelect }>;

@Injectable()
export class RecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  list(kitchenId: string) {
    return this.prisma.mealRecord.findMany({
      where: { kitchenId, deletedAt: null },
      select: recordSelect,
    });
  }

  find(kitchenId: string, id: string) {
    return this.prisma.mealRecord.findFirst({
      where: { id, kitchenId, deletedAt: null },
      select: recordSelect,
    });
  }

  create(
    tx: Prisma.TransactionClient,
    input: {
      kitchenId: string;
      orderId: string | null;
      mealDate: string;
      slot: MealSlot;
      body: string;
      photos: string[];
      dishes: Array<{ dishId: string; nameSnapshot: string }>;
    },
  ) {
    return tx.mealRecord.create({
      data: {
        kitchenId: input.kitchenId,
        orderId: input.orderId,
        mealDate: input.mealDate,
        slot: input.slot,
        body: input.body,
        photos: {
          create: input.photos.map((path, index) => ({ path, sortOrder: index })),
        },
        dishes: { create: input.dishes },
      },
      select: recordSelect,
    });
  }

  replace(
    tx: Prisma.TransactionClient,
    id: string,
    input: {
      mealDate: string;
      slot: MealSlot;
      body: string;
      keepPhotoIds: string[];
      photos: string[];
      dishes: Array<{ dishId: string; nameSnapshot: string }>;
    },
  ) {
    return Promise.all([
      tx.recordPhoto.deleteMany({
        where: { recordId: id, id: { notIn: input.keepPhotoIds } },
      }),
      tx.recordDish.deleteMany({ where: { recordId: id } }),
    ]).then(() =>
      tx.mealRecord.update({
        where: { id },
        data: {
          mealDate: input.mealDate,
          slot: input.slot,
          body: input.body,
          photos: {
            create: input.photos.map((path, index) => ({
              path,
              sortOrder: input.keepPhotoIds.length + index,
            })),
          },
          dishes: { create: input.dishes },
        },
        select: recordSelect,
      }),
    );
  }

  softDelete(id: string) {
    return this.prisma.mealRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  }
}
