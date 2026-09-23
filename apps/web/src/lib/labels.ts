import type { DishStatus, OrderStatus, Role, Slot } from '@/api/types'

export const SLOT_LABEL: Record<Slot, string> = {
  BREAKFAST: '早上',
  LUNCH: '中午',
  DINNER: '晚上',
}

export const ORDER_LABEL: Record<OrderStatus, string> = {
  PENDING: '待接单',
  ACCEPTED: '已接单',
  COMPLETED: '已完成',
  REJECTED: '已拒绝',
  CANCELLED: '已取消',
}

export const ROLE_LABEL: Record<Role, string> = {
  COOKER: '做饭的人',
  EATER: '点餐的人',
}

export const DISH_LABEL: Record<DishStatus, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已上架',
  UNPUBLISHED: '已下架',
}

export const SLOTS: Slot[] = ['BREAKFAST', 'LUNCH', 'DINNER']
