export interface PublishInput {
  name: string;
  summary: string;
  steps: string[];
  coverPath: string | null;
}

export function publishBlockers(dish: PublishInput): string[] {
  const blockers: string[] = [];
  if (dish.name.trim().length === 0) blockers.push('还缺菜名');
  if (!dish.coverPath) blockers.push('还缺封面');
  const hasSummary = dish.summary.trim().length > 0;
  const hasSteps = dish.steps.some((step) => step.trim().length > 0);
  if (!hasSummary && !hasSteps) blockers.push('简介和步骤至少写一项');
  return blockers;
}

export function normalizeSteps(steps: string[] | undefined): string[] {
  return (steps ?? []).map((step) => step.trim()).filter((step) => step.length > 0).slice(0, 30);
}

export const COVER_DAILY_LIMIT = 5;

export function coversRemaining(usedToday: number): number {
  return Math.max(0, COVER_DAILY_LIMIT - usedToday);
}
