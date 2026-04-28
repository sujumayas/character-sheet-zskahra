# State of Project — Phase 5 Review

**Date:** 2026-04-28
**Scope:** Full code review of Phases 0–5 against `docs/frontend-plan.md` and `docs/phase5-plan.md`
**Verdict:** Ship-ready for v1 after three small fixes; everything else flagged is an acknowledged deferral or polish.

---

## Verification method

Findings below are based on:
- Reading every page/editor under `app/(app)/characters/[id]/`
- Reading every module under `lib/domain/` and `lib/data/`
- Cross-referencing against plan §8 (per-page UI), §6 (modeling decisions), §7 (calc pipeline)
- Live DB checks via Supabase MCP for: `traits` seed contents, `pg_policies` coverage on every `character_*` table, `pg_class.relrowsecurity`, and `supabase_migrations.schema_migrations` history

An initial subagent sweep produced several false positives (RLS missing, identity-card UI missing, talent grouping missing, custom-skill modal missing, "field-naming blocker"). Each was checked against the actual code or DB and ruled out before this report was written. The findings below are what survived verification.

---

## What's actually missing or broken

### 🔴 RR Disease + RR Psychic traits are hidden in the UI

`components/.../stats-editor.tsx:30-37` defines `TRAIT_DISPLAY_ORDER` with only 6 trait names. Both rows ARE seeded in `public.traits` (verified via SQL — the `frontend_v1_setup` migration ran). The frontend just doesn't render them.

**Effect:** players cannot buy ranks for RR Disease / RR Psychic, and the +N adol badge for those traits is silently dropped on cultures that grant them.

**Fix:** add the two strings to the array.

### 🔴 Traits never persist `dp_allocated`

Categories, skills, and weapons editors all write `ranks` + `dp_allocated = ranks * cost` on every upsert:

- `categories-editor.tsx:233`
- `skills-editor.tsx:328`
- `weapons-editor.tsx:363`

The trait editor (`stats-editor.tsx:401-417` — `updateTrait`) only writes `ranks` and `special_modifier`. Plan §6.5 added `character_traits.dp_allocated` for symmetry; the column exists in the DB but is never populated.

**Effect:** any future Progression page or unified DP budget that reads `dp_allocated` will under-count trait DP.

**Fix:** mirror the categories/skills/weapons pattern — write `dp_allocated = ranks * cost_per_rank` on every trait rank change. Or compute from `ranks × cost` at render time and drop the column.

### 🟡 `/progression` is still a `<ComingSoon />` stub

`app/(app)/characters/[id]/progression/page.tsx` returns `<ComingSoon phase="Phase 5" tab="Progression dashboard" />`.

Plan §8.6 specs this page as the v1 home for:

- Unified DP budget across categories + skills + weapons + talents (+ training packages when applicable)
- Profession Adaptability +15 surfaced in the budget
- `character_dp_sessions` timeline (DP awarded, by date)
- Pending DPs (delta)

None of the per-tab DP budgets stack today, so there is no single "did this character overspend?" view. Build it before calling v1 done.

---

## Known deferrals (acknowledged in plan/memory; not gaps)

- **Race adolescent grants** — `race_adolescent_rank_rules` has 0 rows. The amber TBD indicator on the Race select (`stats-editor.tsx:707-714`) is the right UX. When data lands, extend `lib/data/character-adolescent-grants.ts` to merge race + birthplace contributions.
- **Adolescent grants for `Armor` / `Mundane Lore` / `Species*` / `Specific Region` / `Weapon Melee`** — ~38 rule rows skipped per phase 4 memory because of name mismatches in the DB. Silent today; no player-visible TBD. Worth surfacing as an info line eventually.
- **BMR height ladder + race armor cap** — Combat tab falls back to direct-edit BMR; the explanatory note at `combat-dashboard.tsx:571` is intentional. Phase 5b plan deferred the seed tables.
- **Magic / spells / Ki / MA / fatigue beyond activity rules** — placeholder rows on Combat/Play; plan §10 + phase5-plan §9 explicitly deferred until the Zskahra magic design is finalized.
- **Training packages**, **DM-approval UI on talents**, **specialization sub-rows + DM review queue** — schema columns exist but no UI. Plan §2 decision #6 + §10 hide all of these in v1.
- **Weapon instances / loot / inventory** — phase5-plan §9 deferred.

---

## Polish items

- **Combat / Play duplicate the same fetch + compute pipeline.** Both `/combat` and `/play` server-fetch then recompute stats / traits / categories / skills / life points. Phase 5c memory flagged this as acceptable for v1 but explicitly noted the drift risk if you touch one and forget the other. A shared `loadCharacterDashboardData` helper is the natural extraction.
- **Mobile pass was static-audit only.** No real-device test. Phase 5d memory called out three likely paper cuts: `px-6` is tight at 320 px, 36 px tap targets are borderline for touch-first users, no sticky positioning anywhere. Real-device pass is the next mobile work.
- **No integration test for the full compute pipeline.** Each `lib/domain/*.test.ts` exercises one function in isolation. The cross-tab pipeline (stats → traits → categories → skills → weapons → equipment) has no end-to-end fixture against the source spreadsheet's sample character. The plan's Phase 1 acceptance criterion ("totals match the rendered `/stats` for a known L1-3 character") is presumably satisfied manually but not automated.
- **Activity-modifier columns on `character_categories` / `character_skills` / `character_weapon_skill`** are read by editors and threaded into `computeSkillLikeRow`, but no UI lets the player edit them. Either intentional (plan §6.3 deferred this column) and they shouldn't be in the SELECT list, or there's a missing surface. Clarify which.
- **Skipped sheet targets in adolescence** are silently dropped rather than surfaced as warnings. Low priority but worth a single info line per affected birthplace.

---

## What was verified working (not gaps despite first impressions)

These were initially flagged but ruled out after direct verification:

- **RLS is fully applied.** Every `character_*` table has `relrowsecurity = true` and 4–5 policies. Migration `frontend_v1_rls_policies` is in `supabase_migrations.schema_migrations`. The agent's "RLS not implemented" alarm was wrong.
- **RR Disease + RR Psychic ARE seeded.** `frontend_v1_setup` inserted them. The bug is purely the frontend display array.
- **Identity card has every promised field.** Sex select (`stats-editor.tsx:734`), Profession Adaptability toggle (line 684), Fate points stepper (line 768), Profession select (line 717), Birthplace select (line 726).
- **Chaos card on `/stats` exists** (`stats-editor.tsx:807-851`).
- **Talents are grouped into Racial / Main / Secondary / Flaws** (`talents-editor.tsx:107-113`, bucketing at lines 168-181). Race-keyed talents come from `race_talents`; the rest from `talent_type`.
- **Custom skill creation modal exists** (`skills-editor.tsx:666` button + line 672 dialog + line 441 insert with `is_custom = true`).
- **Weapon affinity tooltip exists** (`weapons-editor.tsx:617-628`, shows source weapon + transfer modifier).
- **Editable trait ranks** are wired through `NumberStepper` (`stats-editor.tsx:588-595`) — adolescent grants stack on top via `playerRanks + adolRanks` (line 312-316).
- **Race adolescent grants TBD** is already amber-flagged on the Race selector (line 707-714).
- **`character_*.special_bonus` vs `special_modifier` field-naming split** is the documented schema quirk (phase 2 memory). Editors map each table's column to the semantic `special_modifier` input on `computeSkillLikeRow` correctly. Not a bug.
- **Owner-linkage on `characters`** — `frontend_v1_setup` added `owner_user_id`; RLS enforces it. Plan §0 satisfied.

---

## Recommended next moves

In order:

1. **Add `RR Disease`, `RR Psychic` to `TRAIT_DISPLAY_ORDER`.** One-line fix.
2. **Wire `dp_allocated` writes into `updateTrait`** (mirror the categories pattern). Small change in `stats-editor.tsx:401-417`, plus possibly a backfill SQL for existing characters' trait rows.
3. **Build `/progression` page** per plan §8.6:
   - Fetch all `character_categories`, `character_skills`, `character_weapon_skill`, `character_talents`, `character_dp_sessions`
   - Sum `dp_allocated` per group + signed talent cost (flaws negative)
   - Compare to `level_progression` available DP for current level + `+15` if `has_profession_adaptability`
   - List dp_sessions chronologically
4. **(optional)** Extract `loadCharacterDashboardData` shared by `/combat` and `/play` if they're about to grow further.
5. **(optional)** Add an end-to-end "sample-character totals" snapshot test against the seeded test character.

Phases 0–5 are otherwise in good shape and the app works as intended.
