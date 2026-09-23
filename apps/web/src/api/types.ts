export type Role = 'COOKER' | 'EATER'
export type Slot = 'BREAKFAST' | 'LUNCH' | 'DINNER'
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
export type DishStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED'

export interface Profile {
  memberId: string
  membership: null | {
    id: string
    role: Role
    displayName: string
    kitchenId: string
    kitchenStatus: 'PENDING' | 'BOUND' | 'DISSOLVED'
    partner: null | { displayName: string; role: Role }
    invite: null | { code: string; expiresAt: string }
  }
  badges: { todo: number; orders: number; records: number }
}

export interface Dish {
  id: string
  name: string
  summary: string
  ingredients: string
  steps: string[]
  durationMinutes: number | null
  servings: string
  coverPath: string | null
  status: DishStatus
  publishedAt: string | null
  updatedAt: string
  sourceUrl?: string | null
  coversRemaining: number
  blockers: string[]
  candidate: null | { id: string; imagePath: string | null; status: 'READY' | 'FAILED' }
}

export interface MenuDish {
  id: string
  name: string
  summary: string
  ingredients: string
  steps: string[]
  durationMinutes: number | null
  servings: string
  coverPath: string | null
  publishedAt: string | null
}

export interface OrderItem {
  id: string
  dishId: string | null
  name: string
  coverPath: string | null
}

export interface MealOrder {
  id: string
  mealDate: string
  slot: Slot
  note: string
  status: OrderStatus
  message: string
  actorRole: Role | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  recordId: string | null
  items: OrderItem[]
}

export interface MealRecord {
  id: string
  mealDate: string
  slot: Slot
  body: string
  orderId: string | null
  createdAt: string
  updatedAt: string
  photos: Array<{ id: string; path: string }>
  dishes: Array<{ id: string; dishId: string | null; name: string }>
}

export interface InvitePreview {
  kind: 'join' | 'self' | 'invalid' | 'already' | 'abandon'
  code: string
  partnerName?: string
  partnerRole?: Role
  yourRole?: Role
}

export interface DishPayload {
  name: string
  summary?: string
  ingredients?: string
  steps?: string[]
  durationMinutes?: number
  servings?: string
  sourceUrl?: string
}
