// Piecewise rank curves shared by Categories / Skills / Weapons (skill curve)
// and by Traits (trait curve). See docs/frontend-plan.md §6.1.

export function ranksValueSkill(ranks: number): number {
  if (ranks <= 0) return -25;
  const t1 = Math.min(ranks, 10) * 3;
  const t2 = Math.min(Math.max(ranks - 10, 0), 10) * 2;
  const t3 = Math.max(ranks - 20, 0) * 1;
  return t1 + t2 + t3;
}

export function ranksValueTrait(ranks: number): number {
  if (ranks <= 0) return 0;
  const t1 = Math.min(ranks, 10) * 5;
  const t2 = Math.min(Math.max(ranks - 10, 0), 10) * 2;
  const t3 = Math.max(ranks - 20, 0) * 1;
  return t1 + t2 + t3;
}
