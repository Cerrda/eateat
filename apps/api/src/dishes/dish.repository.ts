import { Injectable } from '@nestjs/common';
import { Prisma, type DishStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const dishSelect = {
  id: true,
  kitchenId: true,
  name: true,
  summary: true,
  ingredients: true,
  steps: true,
  durationMinutes: true,
  servings: true,
  coverPath: true,
  sourceUrl: true,
  status: true,
  publishedAt: true,
  deletedAt: true,
  updatedAt: true,
} satisfies Prisma.DishSelect;

export type DishRecord = Prisma.DishGetPayload<{ select: typeof dishSelect }>;

@Injectable()
export class DishRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  list(kitchenId: string) {
    return this.prisma.dish.findMany({
      where: { kitchenId, deletedAt: null },
      select: dishSelect,
      orderBy: { updatedAt: 'desc' },
    });
  }

  menu(kitchenId: string) {
    return this.prisma.dish.findMany({
      where: { kitchenId, deletedAt: null, status: 'PUBLISHED' },
      select: dishSelect,
      orderBy: { publishedAt: 'desc' },
    });
  }

  findInKitchen(kitchenId: string, id: string) {
    return this.prisma.dish.findFirst({
      where: { id, kitchenId, deletedAt: null },
      select: dishSelect,
    });
  }

  findPublished(kitchenId: string, ids: string[]) {
    return this.prisma.dish.findMany({
      where: { kitchenId, id: { in: ids }, deletedAt: null, status: 'PUBLISHED' },
      select: dishSelect,
    });
  }

  findAny(kitchenId: string, ids: string[]) {
    return this.prisma.dish.findMany({
      where: { kitchenId, id: { in: ids }, deletedAt: null },
      select: { id: true, name: true },
    });
  }

  create(kitchenId: string, data: Prisma.DishCreateWithoutKitchenInput) {
    return this.prisma.dish.create({
      data: { ...data, kitchenId },
      select: dishSelect,
    });
  }

  update(id: string, data: Prisma.DishUpdateInput) {
    return this.prisma.dish.update({ where: { id }, data, select: dishSelect });
  }

  setStatus(id: string, status: DishStatus, publishedAt: Date | null) {
    return this.prisma.dish.update({
      where: { id },
      data: { status, publishedAt },
      select: dishSelect,
    });
  }

  softDelete(id: string) {
    return this.prisma.dish.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  }

  countBlockingOrders(dishId: string) {
    return this.prisma.orderItem.count({
      where: { dishId, order: { status: { in: ['PENDING', 'ACCEPTED'] } } },
    });
  }

  countCoversSince(dishId: string, since: Date) {
    return this.prisma.coverAttempt.count({ where: { dishId, createdAt: { gte: since } } });
  }

  latestCover(dishId: string) {
    return this.prisma.coverAttempt.findFirst({
      where: { dishId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, imagePath: true, status: true, adopted: true },
    });
  }

  addCover(dishId: string, status: 'READY' | 'FAILED', imagePath: string | null) {
    return this.prisma.coverAttempt.create({
      data: { dishId, status, imagePath },
      select: { id: true, imagePath: true, status: true, adopted: true },
    });
  }

  findCover(dishId: string, attemptId: string) {
    return this.prisma.coverAttempt.findFirst({
      where: { id: attemptId, dishId },
      select: { id: true, imagePath: true, status: true, adopted: true },
    });
  }

  adopt(tx: Prisma.TransactionClient, dishId: string, attemptId: string, imagePath: string) {
    return Promise.all([
      tx.coverAttempt.updateMany({ where: { dishId }, data: { adopted: false } }),
      tx.coverAttempt.update({ where: { id: attemptId }, data: { adopted: true } }),
      tx.dish.update({ where: { id: dishId }, data: { coverPath: imagePath }, select: dishSelect }),
    ]);
  }
}
