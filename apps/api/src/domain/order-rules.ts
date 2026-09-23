export type OrderStatusName = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
export type RoleName = 'COOKER' | 'EATER';
export type OrderAction = 'accept' | 'reject' | 'complete' | 'cancel';

const ACTIVE = new Set<OrderStatusName>(['PENDING', 'ACCEPTED']);

export function isActiveOrder(status: OrderStatusName): boolean {
  return ACTIVE.has(status);
}

export function slotKey(kitchenId: string, mealDate: string, slot: string): string {
  return `${kitchenId}|${mealDate}|${slot}`;
}

export function canOpenAnotherOrder(status: OrderStatusName | null): boolean {
  if (!status) return true;
  return status === 'COMPLETED' || status === 'REJECTED' || status === 'CANCELLED';
}

export function transitionError(
  status: OrderStatusName,
  action: OrderAction,
  role: RoleName,
): string | null {
  if (action === 'accept' || action === 'reject' || action === 'complete') {
    if (role !== 'COOKER') return '这一边做不了这件事';
  }

  if (action === 'accept' && status !== 'PENDING') return '这一餐现在不能接';
  if (action === 'reject' && status !== 'PENDING') return '这一餐现在不能拒绝';
  if (action === 'complete' && status !== 'ACCEPTED') return '接下之后才能标记做完';
  if (action === 'cancel' && !isActiveOrder(status)) return '这一餐已经结束，不能取消';
  return null;
}

export const SLOT_RANK: Record<string, number> = {
  BREAKFAST: 0,
  LUNCH: 1,
  DINNER: 2,
};

export const RECORD_SLOT_RANK: Record<string, number> = {
  DINNER: 0,
  LUNCH: 1,
  BREAKFAST: 2,
};
