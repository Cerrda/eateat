import { SLOT_RANK } from '../domain/order-rules.js';
import type { OrderRecord } from './order.repository.js';

export function presentOrder(order: OrderRecord) {
  return {
    id: order.id,
    mealDate: order.mealDate,
    slot: order.slot,
    note: order.note,
    status: order.status,
    message: order.message,
    actorRole: order.actorRole,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    completedAt: order.completedAt?.toISOString() ?? null,
    recordId: order.record && !order.record.deletedAt ? order.record.id : null,
    items: order.items.map((item) => ({
      id: item.id,
      dishId: item.dishId,
      name: item.nameSnapshot,
      coverPath: item.coverSnapshot,
    })),
  };
}

export type PresentedOrder = ReturnType<typeof presentOrder>;

export function sortForCooker(orders: PresentedOrder[]): PresentedOrder[] {
  return [...orders].sort((a, b) => {
    const aActive = a.status === 'PENDING' || a.status === 'ACCEPTED' ? 0 : 1;
    const bActive = b.status === 'PENDING' || b.status === 'ACCEPTED' ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    if (aActive === 0) {
      return a.mealDate.localeCompare(b.mealDate) || SLOT_RANK[a.slot] - SLOT_RANK[b.slot];
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function sortForEater(orders: PresentedOrder[]): PresentedOrder[] {
  return [...orders].sort(
    (a, b) => b.mealDate.localeCompare(a.mealDate) || SLOT_RANK[b.slot] - SLOT_RANK[a.slot],
  );
}
