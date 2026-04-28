// Combat Dashboard helpers. See docs/sheet-analysis/Combat_Dashboard.md and
// docs/phase5-plan.md §5.

export const SHIELD_INITIATIVE_PENALTY = 5;

// Walk → Run → Fast Run → Sprint → Dash, all simple multiples of base Walk BMR.
// (The sheet chains the formulas — Run = Walk×2, FR = (Run/2)×3, etc. — but
// every tier reduces to N × Walk for N in 1..5.)
export const MOVEMENT_TIERS = [
  { name: "Walk", multiplier: 1 },
  { name: "Run", multiplier: 2 },
  { name: "Fast Run", multiplier: 3 },
  { name: "Sprint", multiplier: 4 },
  { name: "Dash", multiplier: 5 },
] as const;

// Anima Dodge Maneuver, Zskahra house variant:
//   dodge = max(Quickness_total × 2, Acrobatics_total) + 20
// Quoted verbatim from Combat Dashboard cell J19. Defense skill — does not
// stack with Block/Parry; player picks one to defend with.
export function dodgeManeuver(quTotal: number, acrobaticsTotal: number): number {
  return Math.max(quTotal * 2, acrobaticsTotal) + 20;
}

export interface ActivityModifierRule {
  threshold_percent: number;
  modifier_value: number;
}

// Wound penalty driven by `life_activity_modifier_rules`. Returns the first
// rule whose threshold is ≥ currentLp/maxLp; the sheet's hardcoded
// 25/50/75% × −30/−20/−10 is captured exactly when the DB seed matches.
//
// Edge: empty rules → returns permanentModifier alone (no penalty applied).
// Edge: maxLp ≤ 0 → treat as 0 LP (worst penalty applies).
export function activityModifier(
  currentLp: number,
  maxLp: number,
  rules: readonly ActivityModifierRule[],
  permanentModifier: number = 0,
): number {
  if (rules.length === 0) return permanentModifier;
  const sorted = [...rules].sort(
    (a, b) => a.threshold_percent - b.threshold_percent,
  );
  for (const rule of sorted) {
    const threshold = Math.floor(maxLp * (rule.threshold_percent / 100));
    if (currentLp <= threshold) {
      return rule.modifier_value + permanentModifier;
    }
  }
  return permanentModifier;
}

// Threshold display strings for the activity-mod ladder, e.g.
//   "55 [-10 act]" / "37 [-20 act]" / "18 [-30 act]"
// Matches Combat Dashboard cells D5/D6/D7 (sorted descending by threshold).
export function activityThresholdLabels(
  maxLp: number,
  rules: readonly ActivityModifierRule[],
): Array<{ threshold_percent: number; lp_threshold: number; modifier: number }> {
  return [...rules]
    .sort((a, b) => b.threshold_percent - a.threshold_percent)
    .map((r) => ({
      threshold_percent: r.threshold_percent,
      lp_threshold: Math.floor(maxLp * (r.threshold_percent / 100)),
      modifier: r.modifier_value,
    }));
}

// Initiative w/Shield = base init − 5. Sheet cell H4 = H3 − 5.
export function initiativeWithShield(initiativeBase: number): number {
  return initiativeBase - SHIELD_INITIATIVE_PENALTY;
}
