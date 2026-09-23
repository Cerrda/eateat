import { createRouter, createWebHistory } from 'vue-router'
import KitchenLayout from '@/components/shell/KitchenLayout.vue'
import { useSessionStore } from '@/stores/session'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: KitchenLayout,
      children: [
        { path: '', name: 'root', redirect: { name: 'gate' } },
        { path: 'open', name: 'gate', component: () => import('@/views/GateView.vue') },
        {
          path: 'start',
          name: 'start',
          meta: { guest: true },
          component: () => import('@/views/StartView.vue'),
        },
        {
          path: 'invite',
          name: 'invite',
          meta: { guest: true },
          component: () => import('@/views/InviteView.vue'),
        },
        {
          path: 'wait',
          name: 'wait',
          meta: { guest: true },
          component: () => import('@/views/WaitView.vue'),
        },
        {
          path: 'join',
          name: 'join-entry',
          meta: { guest: true },
          component: () => import('@/views/JoinView.vue'),
        },
        {
          path: 'j/:code',
          name: 'join',
          meta: { guest: true },
          component: () => import('@/views/JoinView.vue'),
        },
        {
          path: 'cook/todo',
          name: 'todo',
          meta: { nav: true, role: 'COOKER' },
          component: () => import('@/views/cook/TodoView.vue'),
        },
        {
          path: 'cook/orders/:id',
          name: 'cook-order',
          meta: { role: 'COOKER' },
          component: () => import('@/views/cook/OrderDetailView.vue'),
        },
        {
          path: 'cook/dishes',
          name: 'dishes',
          meta: { nav: true, role: 'COOKER' },
          component: () => import('@/views/cook/DishesView.vue'),
        },
        {
          path: 'cook/dishes/new',
          name: 'dish-new',
          meta: { role: 'COOKER' },
          component: () => import('@/views/cook/DishEditView.vue'),
        },
        {
          path: 'cook/dishes/:id',
          name: 'dish-edit',
          meta: { role: 'COOKER' },
          component: () => import('@/views/cook/DishEditView.vue'),
        },
        {
          path: 'cook/records',
          name: 'cook-records',
          meta: { nav: true, role: 'COOKER' },
          component: () => import('@/views/records/RecordsView.vue'),
        },
        {
          path: 'cook/records/new',
          name: 'record-new',
          meta: { role: 'COOKER' },
          component: () => import('@/views/records/RecordEditView.vue'),
        },
        {
          path: 'cook/records/:id',
          name: 'cook-record',
          meta: { role: 'COOKER' },
          component: () => import('@/views/records/RecordDetailView.vue'),
        },
        {
          path: 'eat/menu',
          name: 'menu',
          meta: { nav: true, role: 'EATER' },
          component: () => import('@/views/eat/MenuView.vue'),
        },
        {
          path: 'eat/menu/:id',
          name: 'menu-dish',
          meta: { role: 'EATER' },
          component: () => import('@/views/eat/DishDetailView.vue'),
        },
        {
          path: 'eat/confirm',
          name: 'confirm',
          meta: { role: 'EATER' },
          component: () => import('@/views/eat/ConfirmView.vue'),
        },
        {
          path: 'eat/orders',
          name: 'orders',
          meta: { nav: true, role: 'EATER' },
          component: () => import('@/views/eat/OrdersView.vue'),
        },
        {
          path: 'eat/orders/:id',
          name: 'eat-order',
          meta: { role: 'EATER' },
          component: () => import('@/views/eat/OrderDetailView.vue'),
        },
        {
          path: 'eat/records',
          name: 'eat-records',
          meta: { nav: true, role: 'EATER' },
          component: () => import('@/views/records/RecordsView.vue'),
        },
        {
          path: 'eat/records/:id',
          name: 'eat-record',
          meta: { role: 'EATER' },
          component: () => import('@/views/records/RecordDetailView.vue'),
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/SettingsView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const session = useSessionStore()
  await session.boot()

  if (!session.wechat) return to.name === 'gate' ? true : { name: 'gate' }
  if (to.name === 'gate' || to.name === 'root') return session.landing()

  const membership = session.membership
  if (!membership) {
    if (to.meta.guest || to.name === 'join' || to.name === 'join-entry') return true
    return { name: 'start' }
  }

  if (membership.kitchenStatus !== 'BOUND') {
    if (to.name === 'invite' || to.name === 'wait' || to.name === 'join' || to.name === 'join-entry') {
      return true
    }
    return { name: 'wait' }
  }

  if (to.name === 'start' || to.name === 'invite' || to.name === 'wait') {
    return session.landing()
  }

  const role = to.meta.role
  if (role && role !== membership.role) return session.landing()
  return true
})

export default router
