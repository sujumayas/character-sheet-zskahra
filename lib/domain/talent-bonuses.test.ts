import { describe, expect, test } from "bun:test";

import { aggregateTalentBonuses } from "./talent-bonuses";

const TID = {
  statBonusCo: "talent-co",
  twiceStr: "talent-str-x2",
  inactive: "talent-inactive",
  weapon: "talent-weapon",
  choice: "talent-choice",
};

describe("aggregateTalentBonuses", () => {
  test("active talent contributes its fixed stat / category / skill / weapon / trait bonuses", () => {
    const out = aggregateTalentBonuses({
      characterTalents: [
        { id: "ct1", talent_id: TID.statBonusCo, is_active: true, times_taken: 1 },
      ],
      statBonuses: [
        { talent_id: TID.statBonusCo, target_id: "stat-co", bonus: 5 },
      ],
      traitBonuses: [
        { talent_id: TID.statBonusCo, target_id: "trait-luck", bonus: 2 },
      ],
      categoryBonuses: [
        { talent_id: TID.statBonusCo, target_id: "cat-athletic", bonus: 5 },
      ],
      skillBonuses: [
        { talent_id: TID.statBonusCo, target_id: "skill-climb", bonus: 10 },
      ],
      weaponBonuses: [
        { talent_id: TID.statBonusCo, target_id: "weapon-bow", bonus: 5 },
      ],
      choices: [],
    });
    expect(out.stat.get("stat-co")).toBe(5);
    expect(out.trait.get("trait-luck")).toBe(2);
    expect(out.category.get("cat-athletic")).toBe(5);
    expect(out.skill.get("skill-climb")).toBe(10);
    expect(out.weapon.get("weapon-bow")).toBe(5);
  });

  test("inactive talent contributes nothing", () => {
    const out = aggregateTalentBonuses({
      characterTalents: [
        { id: "ct1", talent_id: TID.inactive, is_active: false, times_taken: 1 },
      ],
      statBonuses: [
        { talent_id: TID.inactive, target_id: "stat-co", bonus: 5 },
      ],
      traitBonuses: [],
      categoryBonuses: [],
      skillBonuses: [],
      weaponBonuses: [],
      choices: [],
    });
    expect(out.stat.size).toBe(0);
  });

  test("times_taken multiplies the bonus", () => {
    const out = aggregateTalentBonuses({
      characterTalents: [
        { id: "ct1", talent_id: TID.twiceStr, is_active: true, times_taken: 2 },
      ],
      statBonuses: [
        { talent_id: TID.twiceStr, target_id: "stat-str", bonus: 1 },
      ],
      traitBonuses: [],
      categoryBonuses: [],
      skillBonuses: [],
      weaponBonuses: [],
      choices: [],
    });
    expect(out.stat.get("stat-str")).toBe(2);
  });

  test("multiple active talents that touch the same target stack", () => {
    const out = aggregateTalentBonuses({
      characterTalents: [
        { id: "ct1", talent_id: "tA", is_active: true, times_taken: 1 },
        { id: "ct2", talent_id: "tB", is_active: true, times_taken: 1 },
      ],
      statBonuses: [
        { talent_id: "tA", target_id: "stat-co", bonus: 3 },
        { talent_id: "tB", target_id: "stat-co", bonus: 2 },
      ],
      traitBonuses: [],
      categoryBonuses: [],
      skillBonuses: [],
      weaponBonuses: [],
      choices: [],
    });
    expect(out.stat.get("stat-co")).toBe(5);
  });

  test("character_talent_choices apply per character_talent row", () => {
    const out = aggregateTalentBonuses({
      characterTalents: [
        { id: "ct1", talent_id: TID.choice, is_active: true, times_taken: 1 },
      ],
      statBonuses: [],
      traitBonuses: [],
      categoryBonuses: [],
      skillBonuses: [],
      weaponBonuses: [],
      choices: [
        {
          character_talent_id: "ct1",
          choice_type: "stat",
          stat_id: "stat-pr",
          category_id: null,
          skill_id: null,
          weapon_id: null,
          bonus: 1,
        },
        {
          character_talent_id: "ct1",
          choice_type: "weapon",
          stat_id: null,
          category_id: null,
          skill_id: null,
          weapon_id: "weapon-sword",
          bonus: 5,
        },
      ],
    });
    expect(out.stat.get("stat-pr")).toBe(1);
    expect(out.weapon.get("weapon-sword")).toBe(5);
  });

  test("choices belonging to inactive character_talents are ignored", () => {
    const out = aggregateTalentBonuses({
      characterTalents: [
        { id: "ct1", talent_id: TID.choice, is_active: false, times_taken: 1 },
      ],
      statBonuses: [],
      traitBonuses: [],
      categoryBonuses: [],
      skillBonuses: [],
      weaponBonuses: [],
      choices: [
        {
          character_talent_id: "ct1",
          choice_type: "stat",
          stat_id: "stat-pr",
          category_id: null,
          skill_id: null,
          weapon_id: null,
          bonus: 1,
        },
      ],
    });
    expect(out.stat.size).toBe(0);
  });

  test("choices multiplied by times_taken on the parent character_talent", () => {
    const out = aggregateTalentBonuses({
      characterTalents: [
        { id: "ct1", talent_id: TID.choice, is_active: true, times_taken: 3 },
      ],
      statBonuses: [],
      traitBonuses: [],
      categoryBonuses: [],
      skillBonuses: [],
      weaponBonuses: [],
      choices: [
        {
          character_talent_id: "ct1",
          choice_type: "stat",
          stat_id: "stat-pr",
          category_id: null,
          skill_id: null,
          weapon_id: null,
          bonus: 1,
        },
      ],
    });
    expect(out.stat.get("stat-pr")).toBe(3);
  });
});
