# Adolescence ranks

## Purpose

This tab is a **pure rules/reference grid**, not a per-character allocation surface. It defines how many free "Adolescent" (cultural / upbringing) skill ranks each of the 13 named cultures grants per skill or category. In Anima/Zskahra terms, these are the free skill/category/RR/lore ranks every PC receives at character creation based on the culture (= birthplace) they were born into. Race-based adolescent grants are NOT modeled on this tab — only culture-based ones.

The numbers are static literals (no formulas, no lookups) — this is the **source of truth** that other tabs are expected to read against the character's chosen culture.

## Layout

Single matrix only — there is no "player allocation" half on this tab. Allocations live on the consumer tabs (`2.1 Categories`, `2.2 General Skills`, etc.), which presumably VLOOKUP/INDEX-MATCH back into this grid using the culture name picked on `1. Stats & Traits`.

- **Row 1 (header):** culture names in cols B–M (13 cultures: Ksilnar, Theriv, Litor, Kalvek, Hisven, Sithet, Karven, Poymel, Idral, Halvar, Ikhmar, Logven). Cell A1 = "Culture Ranks".
- **Col A (rows 2–74):** target names — a flat list mixing General Skill names, Secondary Categories, Resistance categories, Weapon categories, and a couple of generics ("Weapon 1", "Weapon 2").
- **Body (B2:M74):** integer rank counts (mostly 1–4). Empty cell = 0 grant for that culture/target pair.
- **Row 75:** stray `=sum(N2:N74)` and `=sum(O2:O74)` in N75/O75 — both yield 0 (cols N/O are empty); look like leftover scaffolding for two extra cultures that were never populated.
- **Row 78 ("Total"):** column sums per culture: Ksilnar 74, Theriv 71, Litor/Kalvek/Hisven 37 each, Sithet/Karven/Poymel 55 each, Idral/Halvar/Ikhmar 56 each, Logven 48. The unequal totals suggest each culture has its own pool size (no uniform "X free ranks" rule).

## Rules grid structure

Targets in column A, in order of appearance:

- **General Skills** (mapped 1:1 to entries on `2.2 General Skills`):
  Animals, Animal Handling, Hunting, Riding (empty row), Acrobatics, Jumping, Athletic Stammina[sic], Brawling, Swimming, Climbing, Awareness, Perception Passive, Perception Active, Lie Perception, Tracking, Duping (empty row), Trade, Signaling, Diplomacy, Public Speaking, Convince, Flora & Fauna, Species\*, Horticulture, Botanics, Sailing, Foragin[sic] (empty), Survival (empty), Geography (empty), Navigation, Specific Region, Weather, Dancing, Play Instrument, Story Telling, Math, Biology (empty), Socio Economics, Accounting, Law, Economics, Religion, History, Race (empty), Politics (empty), Stalking/Hiding, Cooking, Fishing, Farming, Urban, Contacting, Scrounging (empty), Gambling (empty).
- **Secondary Categories** (mapped to category-level rank grants on `2.1 Categories`):
  Athletic Nimble (row 6), Armor (row 13), Communication reactive (row 19), Communication structured (row 22), Performance (row 40), Science Analytic (row 44), Social Sciences (row 51), Subterfuge Active (row 56), Technical/Trained (row 58).
- **Weapon-typed grants:**
  - `Weapon Melee` (row 66), `Weapon Missile` (row 68) — these are **weapon CATEGORIES** (in Anima, melee/missile/shooting/throwing are skill-categories on `2.1 Categories`).
  - `Weapon 1` (row 67), `Weapon 2` (row 69) — these are **player-chosen specific weapons**, i.e. the culture grants you N ranks in "your first/second weapon of choice", which the player then specializes on `2.3 Weapon Dexterity`.
- **Other:**
  - `Endurance` (row 70) — feeds the Endurance / Fatigue stat.
  - `Mundane Lore` (row 71) — likely a category or a knowledge skill.
  - `RR Will`, `RR stam`, `RR Magic` (rows 72–74) — three of the five Anima Resistance Ranks (notably absent: RR Disease, RR Psychic — could be a sheet omission or an intentional design choice for the Zskahra setting).

There is no "specialization name" column — the choice of which Weapon 1 / Weapon 2 / specific Region / Specific Animal etc. is deferred to wherever the player records it elsewhere.

## Cross-tab refs

**None on this tab.** Every body cell is a hard-coded literal. The only formulas in the entire sheet are:

- `N75: =sum(N2:N74)` (orphan, sums an empty column)
- `O75: =sum(O2:O74)` (orphan, sums an empty column)
- `B78:M78: =sum(<col>2:<col>77)` — per-culture totals (12 formulas).

So this tab is read-only data; the consuming tabs (Categories / General Skills / Weapon Dexterity / Resistances) are responsible for pulling the culture column. Expect formulas like `VLOOKUP(<skill name>, 'Adolescence ranks'!$A:$M, MATCH(<culture from Stats & Traits>, 'Adolescence ranks'!$A$1:$M$1, 0), false)` on those tabs.

## DB mapping

The tab is congruent with **`birthplace_adolescent_rank_rules`** only — it does not contain race grants. Mapping:

| Sheet column A (target)                             | DB target_type | DB FK column                    | Notes                                                                                                       |
| --------------------------------------------------- | -------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Athletic Nimble, Armor, Communication \*, Performance, Science Analytic, Social Sciences, Subterfuge Active, Technical/Trained, Weapon Melee, Weapon Missile, Mundane Lore | `category`     | `category_id`                   | Secondary skill categories.                                                                                 |
| Animals, Hunting, Acrobatics, Jumping, Climbing, Awareness, Tracking, Trade, Signaling, Convince, Flora & Fauna, Botanics, Navigation, Weather, Story Telling, Math, Accounting, Religion, Stalking/Hiding, Cooking, Farming, Urban, Contacting, etc. | `skill`        | `skill_id`                      | Standard general skills.                                                                                    |
| RR Will, RR stam, RR Magic                          | `resistance` (?) | n/a — DB has no resistance FK | **Mismatch.** The current `birthplace_adolescent_rank_rules` schema has no `resistance_id` column. Either store as `trait_id` linked to a "RR Will" trait row, or extend schema. |
| Endurance                                           | `trait` (?)    | `trait_id`                      | "Endurance" is a derived stat; needs a corresponding trait row, or a special handler.                       |
| Specific Region, Species\*                          | `skill` + spec | `skill_id` + `specialization_name` | Player picks the specialization at allocation time → goes into `character_adolescent_ranks.specialization_name`. |
| Weapon 1, Weapon 2                                  | `weapon` (?)   | `weapon_id` (player-chosen)     | **Confirms** the open question below — `character_adolescent_ranks.weapon_id` exists precisely for these "free weapon of choice" grants.  |

The sheet has **no language column at all** (target_type `language`), even though `birthplace_adolescent_rank_rules` supports it — language grants for cultures must live on a different tab (probably the Languages section of `1. Stats & Traits` or a dedicated languages tab) or simply aren't modeled in this spreadsheet.

The 13 culture names (Ksilnar … Logven) become 13 rows in `birthplaces`, and each non-empty body cell becomes one row in `birthplace_adolescent_rank_rules` keyed `(birthplace_id, target_type, <fk>)` with `ranks_granted = cell value`. Roughly 13 × ~30 = ~390 rules rows total once seeded.

## Open questions

1. **Weapon-typed adolescent grants — confirmed location.** The tab does include weapon-category grants (`Weapon Melee`, `Weapon Missile` rows) and player-choice weapon grants (`Weapon 1`, `Weapon 2` rows). The latter are why `character_adolescent_ranks.weapon_id` / `weapon_type_id` exist: at character creation the player picks which actual weapons fill those slots. **Action:** in `birthplace_adolescent_rank_rules`, model `Weapon 1`/`Weapon 2` either as `target_type = 'weapon_choice'` with `ranks_granted` and a `pick_index` (1 or 2), or as two separate rule rows with no FK that get materialized into `character_adolescent_ranks` rows once the player chooses a weapon. The DB table for *rules* has no `weapon_id`, which is correct (weapon is player-chosen), but it does need a way to express "N ranks in 1st free weapon" vs. "N ranks in 2nd free weapon".
2. **Race grants are missing from this tab.** The DB has `race_adolescent_rank_rules` but this sheet only encodes culture grants. Either races give zero adolescent ranks in Zskahra, or there is a separate tab (worth checking `1. Stats & Traits`, a hidden tab, or a Race-specific tab) — confirm before seeding.
3. **Resistances vs. categories.** RR Will / RR stam / RR Magic appear here as if they were skill-like targets but Anima usually treats them as separate. Decide whether to (a) add a `resistance_id` FK to the rules tables, (b) treat them as `category` with a special category row, or (c) treat them as `trait`.
4. **Endurance** — same question; is it a stat, a trait, or a special-cased category?
5. **Empty rows** (Riding, Duping, Foragin, Survival, Geography, Biology, Race [knowledge], Politics, Scrounging, Gambling) — these target names exist with no grants from any culture. Keep as 0-rows (don't seed), but the sheet author left them in column A presumably so the row layout matches the master skill list on another tab. Useful as a checklist when seeding skills.
6. **N75/O75 orphan SUMs** — vestigial, ignore.
7. **Missing RRs** — RR Disease and RR Psychic are not in this grid. Confirm whether the Zskahra ruleset drops them or whether they're modeled elsewhere.
8. **Logven anomaly** — Logven (col M) gives no Endurance bonus pattern shared with the rest, has unusual high values in scholarly skills (Story Telling 2, Public Speaking 2, Convince 2, History 2, Math 2, etc.), and the only culture granting Lie Perception, Public Speaking, Dancing-as-1, Play Instrument, Diplomacy. Suggests a "scholar/courtly" archetype — flag for the world-building lead.
