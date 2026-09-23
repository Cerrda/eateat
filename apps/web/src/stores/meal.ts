import { computed, shallowRef, watch } from 'vue'
import { defineStore } from 'pinia'
import type { MenuDish, Slot } from '@/api/types'
import { shanghaiDate } from '@/lib/dates'

const STORAGE = 'eateat-meal'

interface SavedMeal {
  mealDate: string
  slot: Slot | ''
  dishIds: string[]
  note: string
}

function readSaved(): SavedMeal {
  try {
    const raw = sessionStorage.getItem(STORAGE)
    if (!raw) throw new Error('empty')
    return JSON.parse(raw) as SavedMeal
  } catch {
    return { mealDate: shanghaiDate(), slot: '', dishIds: [], note: '' }
  }
}

export const useMealStore = defineStore('meal', () => {
  const saved = readSaved()
  const mealDate = shallowRef(saved.mealDate || shanghaiDate())
  const slot = shallowRef<Slot | ''>(saved.slot)
  const dishIds = shallowRef<string[]>(saved.dishIds ?? [])
  const note = shallowRef(saved.note ?? '')

  const count = computed(() => dishIds.value.length)
  const ready = computed(() => Boolean(slot.value) && dishIds.value.length > 0 && dishIds.value.length <= 6)

  watch([mealDate, slot, dishIds, note], () => {
    const payload: SavedMeal = {
      mealDate: mealDate.value,
      slot: slot.value,
      dishIds: dishIds.value,
      note: note.value,
    }
    sessionStorage.setItem(STORAGE, JSON.stringify(payload))
  })

  function toggle(dish: MenuDish) {
    dishIds.value = dishIds.value.includes(dish.id)
      ? dishIds.value.filter((id) => id !== dish.id)
      : dishIds.value.length >= 6
        ? dishIds.value
        : [...dishIds.value, dish.id]
  }

  function clear() {
    dishIds.value = []
    note.value = ''
  }

  return { mealDate, slot, dishIds, note, count, ready, toggle, clear }
})
