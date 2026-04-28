# Zskahra Character Sheet — Frontend Plan

**Status:** approved 2026-04-27 · stack & open-questions resolved · ready to start Phase 0
**Owner:** sujumayas@gmail.com
**Repo state:** no code yet · pre-existing Supabase DB (project_ref `lgczxwbkpwhsdhgtgkuo`) is the source of truth

---

## 1. Context

The product is a web app for the **Anima: Beyond Fantasy** TTRPG running in a custom **"Zskahra"** world. The Supabase database is already designed and seeded with the rules data (75 tables — see `memory/db_schema_shape.md`). The Google Sheet at `https://docs.google.com/spreadsheets/d/10nV_ow4wQCq-h8-_vWjfYOZM5HbCy4foTWBmloakbJE/` is the working character sheet we're porting.

Test characters will be **L1-3**. We are NOT building a separate creation flow — the Character Page opens directly to an editable view. The same surface handles both new and existing characters.

**Backend = Supabase only.** No separate API server. Direct DB access from the client through Row Level Security. Edge Functions only when something genuinely can't be done in-client (none anticipated for v1).

## 2. Decisions locked in

| # | Question | Decision |
|---|---|---|
| 1 | DP cost for skills | Drive from `stat_cost_rules` (stat-total → dp_cost). Sheet's flat per-stat-code is a shortcut, not authoritative. |
| 2 | Trait DB migrations (add `ranks`/`dp_allocated` to `character_traits`, add 2 traits for RR Disease + RR Psychic) | Apply the migrations |
| 3 | Sex/gender on identity card | Surface (`character_description.sex_id` → `race_sexes`) |
| 4 | Profession Adaptability +15 DP at L1 | Surface as a toggle on the identity card |
| 5 | Custom skills | Per-character (scope a custom skill to one character via a `character_id` column on `skills`) |
| 6 | Specialization DM-approval flow | Hide v1. Skill specializations create `character_skill_access` rows but the DM-review UI is out of scope. |

**Stack:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + `@supabase/ssr` + Zod. Vercel deploy.
**UI language:** English. Spanish ONLY where source data is Spanish (talent/flaw descriptions). No i18n library.
**Two-character-table convention:** read/write `character_description` for descriptive fields; `characters` is identity/ownership only (name, dm_id, world_id, level, total_dp, available_dp, status, **and** the new `owner_user_id`).

## 3. Sheet tab inventory

| Tab | State | Disposition for v1 |
|---|---|---|
| `1. Stats & Traits` | Full data, zero cross-tab refs (it's the source) | **Implement** as `/stats` |
| `2.1 Categories` | 41 categories: Traits 2-7 / General 8-33 / Weapons 34-42 | **Implement** as `/categories` |
| `2.2 General Skills` | 108 skills + ~16 custom slots, piecewise rank curve | **Implement** as `/skills` |
| `2.3 Weapon Dexterity` | 22 weapons × 22 affinity matrix | **Implement** as `/weapons` |
| `2.4 Magic` | Empty mislabeled scaffold | **Defer.** Custom system likely uses `character_chaos`. |
| `2.5 Talents&Flaws` | Free-form list (typed by hand) | **Replace with structured picker** as `/talents` |
| `TALENTS\|FLAWS LIST` | 5-col prose catalog, ~248 unique entries | Reference only; DB has 326 (richer) |
| `Talents tables` | 121 `(talent, target, bonus)` rows | Reference only; DB has 209 (richer) |
| `Training Packages` | Empty stub (9 slot scaffolds) | **Defer.** DB schema is ready when we want it. |
| `Level Progression` | L1-85 XP/DP table + live DP-spend dashboard | Reference + drives `/progression` widget |
| `Adolescence ranks` | 13-culture × 73-target rules matrix | Maps to `birthplace_adolescent_rank_rules`; surface as locked rows |
| `Playing/Combat Dashboard`, `Equipment` | Summaries | **Defer to Phase 5+** |

Per-tab deep-dive analyses live in `docs/sheet-analysis/`. Each formula and cross-tab reference is documented there.

## 4. Architecture

### 4.1 Project layout

```
app/
  (auth)/login/page.tsx           # Email OTP request + verify
  (auth)/auth/callback/route.ts   # Supabase magic-link callback
  (app)/
    layout.tsx                    # nav, character switcher, sign-out
    characters/
      page.tsx                    # list owned characters
      [id]/
        layout.tsx                # tab nav within a sheet
        page.tsx                  # redirect → /stats
        stats/page.tsx            # tab 1
        categories/page.tsx       # tab 2.1
        skills/page.tsx           # tab 2.2
        weapons/page.tsx          # tab 2.3
        talents/page.tsx          # tab 2.5 (replaced)
        progression/page.tsx      # Level Progression dashboard

lib/
  supabase/
    server.ts                     # createServerClient
    client.ts                     # createBrowserClient
    types.ts                      # generated via `supabase gen types`
  domain/
    rules.ts                      # piecewise rank curves
    dp-cost.ts                    # cost-per-rank lookups
    modifiers.ts                  # stacking + computeTotal
    progression.ts                # level <-> DP, profession-adaptability
    weapon-affinity.ts            # transfer-matrix calc
  hooks/
    useCharacter.ts               # SWR-style realtime character query
    useCategories.ts, useSkills.ts, useWeapons.ts, useTalents.ts

components/
  sheet/
    StatRow.tsx, TraitRow.tsx, CategoryRow.tsx, SkillRow.tsx, WeaponRow.tsx
    RankStepper.tsx               # +/- with DP cost preview
    ModifierPopover.tsx           # show breakdown of a Total
    DpBudgetWidget.tsx            # spent / available / pending
  ui/                             # shadcn primitives
```

### 4.2 Auth

- **Method:** email OTP via Supabase Auth (magic link). No password.
- **Flow:** `/login` → enter email → Supabase sends link → callback at `/auth/callback` exchanges code for session → cookie set via `@supabase/ssr` → redirect to `/characters`.
- **Sign-out:** clear server session, redirect to `/login`.

### 4.3 RLS strategy

The DB has RLS enabled on every table but **no policies are written yet**. We need to add them.

**Public-read** (anon + authenticated):
- All catalog/lookup tables: `stats`, `categories`, `skills`, `traits`, `weapons`, `weapon_types`, `weapon_affinity`, `languages`, `language_rank_levels`, `social_suffixes`, `talents`, `talent_requirements`, `talent_*_bonuses`, `races`, `race_*` (modifiers, age/height/weight ranges, sexes, special rules, adolescent rank rules, talents), `professions`, `birthplaces`, `birthplace_*`, `training_packages`, `training_package_*`, `game_values`, `game_entity_types`, `requirement_value_types`, `stat_progression`, `stat_cost_rules`, `rank_bonus_progression`, `level_progression`, `life_activity_modifier_rules`, `worlds`.

**Owner-only** (`auth.uid()` matches `characters.owner_user_id` joined via `character_id`):
- All `character_*` tables: `character_stats`, `character_stat_modifiers`, `character_stat_special_allocations`, `character_categories`, `character_skills`, `character_skill_access`, `character_weapon_skill`, `character_traits`, `character_languages`, `character_talents`, `character_talent_choices`, `character_training_packages`, `character_training_package_choices`, `character_adolescent_ranks`, `character_social_suffixes`, `character_activity_modifiers`, `character_temporary_modifiers`, `character_game_modifiers`, `character_game_values`, `character_chaos`, `character_life_points`, `character_dp_sessions`, `character_description`.
- `characters` itself: `select` if owner; `update` if owner; `insert` if `owner_user_id = auth.uid()`.

**DM-only**:
- `dungeon_masters`: read public; write only when `user_id = auth.uid()`.

Policy template (per character_* table — applied for SELECT/INSERT/UPDATE/DELETE):
```sql
CREATE POLICY "owner_only_select" ON character_skills FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = character_skills.character_id
      AND c.owner_user_id = auth.uid()
  )
);
-- repeat for INSERT/UPDATE/DELETE with WITH CHECK
```

### 4.4 Data fetching pattern

- **Read-heavy lookup data** (stats, categories, skills, talents, weapon_affinity, progression ladders): fetch once at the layout level via Server Components. Cache aggressively (`revalidate: 3600`) since these change rarely.
- **Per-character data**: fetch on the page Server Component for SSR, hand off to a Client Component for editing. Use TanStack Query for cache-and-mutate, with optimistic updates.
- **Mutations**: direct Supabase upserts from the client. Save-on-blur (debounced 400ms for steppers).

## 5. Required DB migrations (Phase 0)

All in one migration file `supabase/migrations/<ts>_frontend_v1_setup.sql`. Apply via `mcp__supabase__apply_migration` or `supabase db push`.

```sql
-- 1. Owner linkage
ALTER TABLE characters ADD COLUMN owner_user_id uuid REFERENCES auth.users(id);
ALTER TABLE dungeon_masters ADD COLUMN user_id uuid REFERENCES auth.users(id);
CREATE INDEX idx_characters_owner ON characters(owner_user_id);

-- 2. Trait ranks (sheet shows ranks bought via DP for the 6 traits in 2.1 rows 2-7)
ALTER TABLE character_traits ADD COLUMN ranks int NOT NULL DEFAULT 0;
ALTER TABLE character_traits ADD COLUMN dp_allocated int NOT NULL DEFAULT 0;

-- 3. Add the two missing traits surfaced by Adolescence ranks tab
INSERT INTO traits (name, primary_stat_id, secondary_stat_id, is_active) VALUES
  ('RR Disease',  (SELECT id FROM stats WHERE code = 'co'), NULL, true),
  ('RR Psychic',  (SELECT id FROM stats WHERE code = 'pr'), NULL, true);
-- (verify stat codes match the seed; adjust if needed)

-- 4. Per-character custom skills
ALTER TABLE skills ADD COLUMN character_id uuid REFERENCES characters(id) ON DELETE CASCADE;
CREATE INDEX idx_skills_character ON skills(character_id);
-- Custom skills query becomes: WHERE character_id IS NULL OR character_id = :id

-- 5. Profession Adaptability flag (L1 +15 DP advantage)
ALTER TABLE characters ADD COLUMN has_profession_adaptability bool NOT NULL DEFAULT false;
```

Then **all RLS policies** (a separate migration to keep them reviewable). Template covers ~25 character_* tables — use a generator or hand-write them. See §4.3 for the policy shape.

After migrations: `supabase gen types typescript --linked > lib/supabase/types.ts` to regenerate types.

## 6. Modeling decisions

### 6.1 Universal piecewise rank curve

Two curves used across Categories, Skills, Weapons:

```ts
// lib/domain/rules.ts

export function ranksValueSkill(ranks: number): number {
  if (ranks <= 0) return -25;
  const t1 = Math.min(ranks, 10) * 3;
  const t2 = Math.min(Math.max(ranks - 10, 0), 10) * 2;
  const t3 = Math.max(ranks - 20, 0) * 1; // floor handled by integer math
  return t1 + t2 + t3;
}

export function ranksValueTrait(ranks: number): number {
  if (ranks <= 0) return 0;
  const t1 = Math.min(ranks, 10) * 5;
  const t2 = Math.min(Math.max(ranks - 10, 0), 10) * 2;
  const t3 = Math.max(ranks - 20, 0) * 1;
  return t1 + t2 + t3;
}
```

These are computed on read every time. **Never** persist `rank_bonus` in `character_skills.rank_bonus` — leave that DB column unused or backfill from the function.

### 6.2 DP cost lookup

```ts
// lib/domain/dp-cost.ts

// stat_cost_rules: stat_total -> dp_cost (44 rows in DB)
// Applies to: categories, skills, weapon skills, traits
// Per locked decision #1.

export function dpCostPerRank(statTotal: number, costRules: StatCostRule[]): number {
  // Binary search the closest rule whose stat_total <= statTotal; return its dp_cost.
  // The 44 rows form a step function across 0..200+.
  return lookupStep(costRules, statTotal);
}
```

Sheet's flat-by-stat-code (`in`=2, `pr`=4, else=3) is the simplification of this curve at typical L1 stat values. We use the table for accuracy at high stats.

### 6.3 Modifier stacking — explicit columns first, polymorphic later

Use the explicit per-row columns the sheet uses:
- `talent_bonus` (sum from `talent_*_bonuses` joined through `character_talents`)
- `special_modifier` (player-edited free field)
- `manual_modifier` (player-edited override)

Skip these columns in v1 (defer until needed):
- `professional_bonus`, `temp_modifier`, `activity_modifier`, `equipment_bonus`, `gm_bonus`

Don't use `character_game_modifiers` (the polymorphic table) yet. It's a future migration target when bonus attribution becomes important (e.g. a "where does this +5 come from?" tooltip).

### 6.4 Talent effects

The catalog has free-form prose effects. The DB has 6 typed bonus tables covering ~58% of catalog talents. For v1:

1. **Catalog picker** — searchable list from `talents` (326 rows), filtered by `talent_type`. Shows description, cost, requirements (all prose).
2. **Per-character row** — `character_talents` with `times_taken`, `acquired_level`, plus an **Apply** toggle (custom UI state — store as a new column or in a JSON field; recommendation: add `is_active bool default true` to `character_talents`).
3. **Bonus application** — when **Apply** is on AND there are `talent_*_bonuses` rows for the talent, those bonuses sum into `talent_bonus` columns of the affected rows. For talents with only prose, the player records the effect in the talent's notes; **no bonus is auto-applied** (player adjusts `special_modifier` manually if needed).
4. **Choices** — when a talent's bonus has `requirement_value_type` indicating a player choice (e.g. "+1 to a stat of choice"), a sub-form prompts the player to pick the target. The choice is recorded in `character_talent_choices`. Without a resolved choice, the bonus is treated as 0.

This sidesteps the prose-parsing problem entirely.

### 6.5 Trait modeling

Per locked decision #2:
- Add `ranks` and `dp_allocated` to `character_traits`.
- Insert 2 rows into `traits` for RR Disease + RR Psychic.

Per-trait total formula:
```
trait_total =
  ranksValueTrait(ranks)
+ raceModifier              // race_trait_modifiers
+ birthplaceModifier        // birthplace_trait_modifiers
+ primaryStatBonus          // stat_progression.bonus for primary_stat_id
+ secondaryStatBonus        // 0 if secondary_stat_id is null
+ talentBonusSum            // talent_trait_bonuses
+ special_modifier          // free-edit
+ talent_bonus              // (computed) sum from talent_trait_bonuses
+ gm_bonus                  // unused v1
+ temp_modifier             // unused v1
```

### 6.6 Weapon affinity

`weapon_affinity` is read-only data (88 rows). Per-weapon total:

```ts
// For each weapon W of the character:
// natural_W = ranksValueSkill(ranks) + cat_bonus + stat_bonus + talent_bonus + special_modifier
// transfer_in_W = max over all other weapons O of:
//   natural_O + (affinity from O→W, which is negative; e.g. -30)
// total_W = max(natural_W, transfer_in_W)
```

Compute in client per render. It's a 22×22 lookup, trivial.

## 7. Calculation pipeline

One pure function applied uniformly across stats / traits / categories / skills / weapons:

```ts
// lib/domain/modifiers.ts

interface ComputeContext {
  stats: Map<StatId, number>;            // total for each stat (stat_progression.bonus)
  categories: Map<CategoryId, number>;   // category total (sums into skills/weapons)
  raceModifiers: Map<TargetKey, number>;
  birthplaceModifiers: Map<TargetKey, number>;
  talentBonuses: Map<TargetKey, number>; // pre-aggregated from talent_*_bonuses for active talents
  costRules: StatCostRule[];
}

export function computeSkillTotal(skill: CharacterSkill, lookup: SkillLookup, ctx: ComputeContext): {
  ranksValue: number;
  catValue: number;
  statValue: number;
  talentBonus: number;
  specialModifier: number;
  total: number;
  dpSpent: number;
  costPerRank: number;
} {
  const ranksValue = ranksValueSkill(skill.ranks);
  const catValue = ctx.categories.get(lookup.category_id) ?? 0;
  const statValue = ctx.stats.get(lookup.stat_id) ?? 0;
  const talentBonus = ctx.talentBonuses.get(targetKey('skill', skill.skill_id)) ?? 0;
  const specialModifier = skill.special_bonus ?? 0;
  const total = ranksValue + catValue + statValue + talentBonus + specialModifier;
  const costPerRank = dpCostPerRank(rawStatTotal(lookup.stat_id, ctx), ctx.costRules);
  const dpSpent = skill.ranks * costPerRank;
  return { ranksValue, catValue, statValue, talentBonus, specialModifier, total, dpSpent, costPerRank };
}
```

Mirror functions for category, trait, weapon, stat. Test all of them against the sample character in the sheet.

## 8. Per-page UI

### 8.1 `/characters/[id]/stats`

**Identity card** (top):
- Name, character_name, player_name (editable)
- Race, Profession, Birthplace selects → write to `characters.race_id` etc.
- Sex select (`character_description.sex_id` → `race_sexes` filtered by current race) — per locked #3
- Age, height_cm, weight_kg, appearance_roll, appearance_notes (`character_description`)
- Fate points stepper (`character_description.fate_points`)
- **Profession Adaptability toggle** (`characters.has_profession_adaptability`) — per locked #4 — recomputes L1 DP base from 70 to 85
- Level (read-only, derived from `total_dp` via `level_progression`)

**Stats grid** (8 rows): `name | base | race_mod | special_mod | total | bonus`
- `base` editable (1-12 typical)
- `race_mod` joined from `race_stat_modifiers`
- `bonus` from `stat_progression`
- Validation surfaces (warnings only): sum-of-bases == 8 at L1, no single base > 3, etc.

**Traits grid** (8 rows: 6 original + RR Disease, RR Psychic):
- `name | gov stats | race_mod | birthplace_mod | ranks | special | total`
- Ranks stepper with DP-cost preview

**Chaos card**: `chaos_index/track/dice/power_calculator` (`character_chaos`).

**Life Points card**: `current_life_points/dm_activity_modifier/has_activity_penalty_reduction` (`character_life_points`).

### 8.2 `/characters/[id]/categories`

Three grouped tables (Traits / General / Weapons), each row:

`name | gov stat | DP cost/rank (computed) | ranks (stepper) | ranks_value | stat_value | talent_bonus | special_mod | activity_mod | total`

- DP-budget header: `Σ(ranks × cost) = X / Y available` — Y comes from `level_progression` for the character's current level (plus +15 if Profession Adaptability enabled).
- "Modified" column from sheet replaced by per-category `activity_modifier` (DB has it; sheet only had a global cell).

### 8.3 `/characters/[id]/skills`

Skills grouped by category (collapsible). Default-expanded for categories where the character has ranks. Per row:

`skill | stat | DP cost/rank | ranks | ranks_value | cat_value | stat_value | talent_bonus | special_mod | total`

- "+ Add custom skill" button → modal: name, category, stat, allows_specialization. Creates a `skills` row with `is_custom = true` and `character_id = <this character>` per locked #5.
- Specialization slots (when `skills.allows_specialization = true`): "+ Specialization" sub-row creates a `character_skill_access` row with `approval_status = 'pending'`. Per locked #6, NO DM-approval UI; the row exists silently.

### 8.4 `/characters/[id]/weapons`

22 weapons + character-specific custom slots. Per row:

`weapon | stat | category | ranks | ranks_value | cat_bonus | stat_bonus | talent_bonus | special | natural | best_via_affinity | total`

- "Best via affinity" tooltip lists the source weapon and the transfer penalty.
- `total = max(natural, best_via_affinity)`.
- Adolescent ranks + package ranks shown as locked badges next to the weapon name.

### 8.5 `/characters/[id]/talents`

- DP-spent-on-talents header.
- 4 sections: Racial / Main / Secondary / Flaws (driven by `talents.talent_type`).
- "+ Add talent" → modal with searchable list filtered by section. Show name, cost, requirements (prose), description (prose).
- Per-character row: cost, times taken, acquired_level, **Apply** toggle (`character_talents.is_active`), choices sub-form (when applicable), DM-approval indicator (read-only).
- Flaws have negative cost — total DP shows `+15` style for Chaos Sensitivity.

### 8.6 `/characters/[id]/progression`

Replicates the right-block dashboard from `Level Progression`:
- DP available (from `level_progression` for current level + Profession Adaptability)
- DP spent breakdown: Categories / Skills / Weapons / Talents / Training Packages
- Pending DPs (delta)
- Linear timeline of `character_dp_sessions` (DP awarded, by date)

## 9. Phased roadmap

### Phase 0 — foundation (1-2 days)

- [ ] `npx create-next-app@latest` — TS, Tailwind, App Router, ESLint, src dir off
- [ ] Install: `@supabase/ssr @supabase/supabase-js zod @tanstack/react-query`
- [ ] Install shadcn/ui + the primitives we need (Button, Input, Select, Dialog, Table, Tabs, Stepper, Tooltip, Popover, Toast)
- [ ] Generate types: `supabase gen types typescript --linked > lib/supabase/types.ts`
- [ ] Apply migrations from §5 (one file, owner linkage + traits + custom skills + profession adaptability)
- [ ] Apply RLS policies (separate migration)
- [ ] OTP login flow: `/login` page + callback route + middleware to gate `(app)/*`
- [ ] CI: `bun run typecheck && bun run lint` on push

**Acceptance:** A logged-in user lands on an empty `/characters` page; logged-out goes to `/login`.

### Phase 1 — read-only sheet (2-3 days)

- [ ] Seed one test character row (with `owner_user_id = <your user>` and L1-3 data extracted from the sheet)
- [ ] Build `lib/domain/{rules, dp-cost, modifiers, weapon-affinity, progression}.ts` with unit tests against the sheet's sample values
- [ ] Build `(app)/characters/[id]/layout.tsx` with tab nav
- [ ] Render `/stats` read-only
- [ ] Compare every total to the sheet for the seeded character — they must match

**Acceptance:** Sheet's `1. Stats & Traits` totals match the rendered `/stats` for a known L1-3 character.

### Phase 2 — editing core sheet (3-5 days)

- [ ] Identity card editable (writes `characters` + `character_description`)
- [ ] Stats grid editable (base + special)
- [ ] Traits grid editable (ranks + special)
- [ ] Categories page fully editable, with DP-budget widget
- [ ] Skills page fully editable, custom-skill creation
- [ ] Weapons page fully editable, affinity tooltip
- [ ] Save-on-blur for inputs; +/- steppers for ranks (debounced 400ms)
- [ ] Optimistic updates with TanStack Query

**Acceptance:** Edit ranks anywhere — the DP-budget widget updates, totals propagate, refresh preserves state, network tab shows reasonable upserts.

### Phase 3 — talents (2-3 days)

- [ ] Catalog picker (searchable, filtered by type)
- [ ] Per-character talent rows (`character_talents`)
- [ ] Apply toggle wired into bonus aggregation (`talent_*_bonuses` JOINed in)
- [ ] Choices sub-form for talents that need them (`character_talent_choices`)
- [ ] Flaws section (negative-cost handling in DP budget)

**Acceptance:** Adding the "Bonus +1 STR" talent lifts the relevant stat's `talent_bonus` from 0 to 1, and the change reflects in dependent skills/weapons.

### Phase 4 — Adolescence + race grants (1-2 days)

- [ ] On character creation/load, pre-populate `character_adolescent_ranks` from `birthplace_adolescent_rank_rules` (per the matrix on the Adolescence ranks tab).
- [ ] Surface those grants as locked, badged rows in skills/categories/weapons.
- [ ] Weapon-pick slot UX: when `target_type='weapon'` is unresolved, prompt the player to pick a weapon.
- [ ] Race granted ranks (currently NOT in the sheet's adolescence tab) — flag as "TBD: needs race_adolescent_rank_rules data" in the UI.

**Acceptance:** A new character with a chosen birthplace shows the correct free ranks pre-assigned and the totals are right.

### Phase 5 — dashboards & polish (later)

- [ ] Combat Dashboard (`Combat Dashboard` tab)
- [ ] Playing Dashboard (`Playing Dashboard` tab)
- [ ] Equipment (`Equipment` tab)
- [ ] Mobile-responsive review
- [ ] Magic — only when its design is finalized. The current sheet stub is meaningless; the `character_chaos` table likely IS the magic system.

## 10. Out of scope for v1

- DM-side views (skill-access approvals, world admin, DP awards UI). The DB supports them; the frontend doesn't surface them.
- Multi-character compare / party views.
- Character creation wizard (the edit page handles it).
- Training packages (DB ready, no data; defer).
- Spell/magic system (defer).
- Push notifications / realtime collaboration.
- Print-friendly PDF export.

## 11. References

- **DB schema dump (verbose):** `.tmp/sheets/...` from the `mcp__supabase__list_tables` tool result (108K — re-run if needed).
- **Per-tab sheet analyses** (durable):
  - `docs/sheet-analysis/1_Stats_Traits.md`
  - `docs/sheet-analysis/2.1_Categories.md`
  - `docs/sheet-analysis/2.2_General_Skills.md`
  - `docs/sheet-analysis/2.3_Weapon_Dexterity.md`
  - `docs/sheet-analysis/2.4_Magic.md`
  - `docs/sheet-analysis/2.5_Talents_Flaws.md`
  - `docs/sheet-analysis/TALENTS_FLAWS_LIST.md`
  - `docs/sheet-analysis/Talents_tables.md`
  - `docs/sheet-analysis/Training_Packages.md`
  - `docs/sheet-analysis/Level_Progression.md`
  - `docs/sheet-analysis/Adolescence_ranks.md`
  - `docs/sheet-analysis/Combat_Dashboard.md`
  - `docs/sheet-analysis/Playing_Dashboard.md`
  - `docs/sheet-analysis/Equipment.md`
- **Source spreadsheet:** `https://docs.google.com/spreadsheets/d/10nV_ow4wQCq-h8-_vWjfYOZM5HbCy4foTWBmloakbJE/`
- **Supabase project ref:** `lgczxwbkpwhsdhgtgkuo`
- **Memory files:** `memory/project_overview.md`, `memory/db_schema_shape.md`, `memory/user_preferences.md`

## 12. Open items not blocking Phase 0

- Race-adolescent grant data is missing from the sheet's `Adolescence ranks` tab (only birthplace data is there). Either source it from the Anima rulebook and seed `race_adolescent_rank_rules`, or live without it. Surface as a TODO in Phase 4.
- The `2.4 Magic` tab is empty. If/when a Zskahra magic system is finalized, decide whether `character_chaos` is sufficient or new tables are needed.
- The Talents tables in the sheet have ~58% coverage of catalog talents. Backfilling the DB's `talent_*_bonuses` for the missing talents is a slow project; do it as the system needs them, not all at once.
- Validation rules ("stats sum to 8 at L1", "no single stat >3", etc.) are textual labels in the sheet. Implement as warnings (not blockers) in the frontend; players can intentionally violate them.
