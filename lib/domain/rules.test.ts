import { describe, expect, test } from "bun:test";

import { ranksValueSkill, ranksValueTrait } from "./rules";

describe("ranksValueSkill (3/2/1 piecewise, -25 floor)", () => {
  test("zero or negative ranks → -25", () => {
    expect(ranksValueSkill(0)).toBe(-25);
    expect(ranksValueSkill(-3)).toBe(-25);
  });

  test("first tier: +3 per rank up to rank 10", () => {
    expect(ranksValueSkill(1)).toBe(3);
    expect(ranksValueSkill(5)).toBe(15);
    expect(ranksValueSkill(10)).toBe(30);
  });

  test("second tier: +2 per rank between 11 and 20", () => {
    expect(ranksValueSkill(11)).toBe(32);
    expect(ranksValueSkill(15)).toBe(40);
    expect(ranksValueSkill(20)).toBe(50);
  });

  test("third tier: +1 per rank above 20", () => {
    expect(ranksValueSkill(21)).toBe(51);
    expect(ranksValueSkill(30)).toBe(60);
  });
});

describe("ranksValueTrait (5/2/1 piecewise, 0 floor)", () => {
  test("zero or negative ranks → 0", () => {
    expect(ranksValueTrait(0)).toBe(0);
    expect(ranksValueTrait(-1)).toBe(0);
  });

  test("first tier: +5 per rank up to rank 10", () => {
    expect(ranksValueTrait(1)).toBe(5);
    expect(ranksValueTrait(10)).toBe(50);
  });

  test("second tier: +2 per rank between 11 and 20", () => {
    expect(ranksValueTrait(11)).toBe(52);
    expect(ranksValueTrait(20)).toBe(70);
  });

  test("third tier: +1 per rank above 20", () => {
    expect(ranksValueTrait(21)).toBe(71);
    expect(ranksValueTrait(30)).toBe(80);
  });
});
