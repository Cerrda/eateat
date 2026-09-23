export function cookerTodoBadge(pendingCount: number): number {
  return Math.max(0, pendingCount);
}

export function eaterOrderBadge(changedSinceSeen: number): number {
  return Math.max(0, changedSinceSeen);
}

export function recordBadge(partnerRecordsSinceSeen: number): number {
  return Math.max(0, partnerRecordsSinceSeen);
}
