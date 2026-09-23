import { coversRemaining, publishBlockers } from '../domain/dish-rules.js';
import type { DishRecord } from './dish.repository.js';

export function readSteps(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((step): step is string => typeof step === 'string');
}

export function presentDish(
  dish: DishRecord,
  usedCovers: number,
  candidate: { id: string; imagePath: string | null; status: 'READY' | 'FAILED'; adopted: boolean } | null,
  includeSource: boolean,
) {
  const steps = readSteps(dish.steps);
  return {
    id: dish.id,
    name: dish.name,
    summary: dish.summary,
    ingredients: dish.ingredients,
    steps,
    durationMinutes: dish.durationMinutes,
    servings: dish.servings,
    coverPath: dish.coverPath,
    status: dish.status,
    publishedAt: dish.publishedAt?.toISOString() ?? null,
    updatedAt: dish.updatedAt.toISOString(),
    sourceUrl: includeSource ? dish.sourceUrl : undefined,
    coversRemaining: coversRemaining(usedCovers),
    blockers: publishBlockers({
      name: dish.name,
      summary: dish.summary,
      steps,
      coverPath: dish.coverPath,
    }),
    candidate:
      candidate && !candidate.adopted
        ? { id: candidate.id, imagePath: candidate.imagePath, status: candidate.status }
        : null,
  };
}

export function presentMenuDish(dish: DishRecord) {
  return {
    id: dish.id,
    name: dish.name,
    summary: dish.summary,
    ingredients: dish.ingredients,
    steps: readSteps(dish.steps),
    durationMinutes: dish.durationMinutes,
    servings: dish.servings,
    coverPath: dish.coverPath,
    publishedAt: dish.publishedAt?.toISOString() ?? null,
  };
}
