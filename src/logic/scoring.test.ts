import { describe, expect, it } from "vitest";
import { axes, people, questions } from "../data/content";
import type { Person } from "../types/nbti";
import { findBestAnswerPath } from "./calibration";
import { calculateResult, distance, getSymmetricBounds } from "./scoring";

describe("scoring", () => {
  it("uses symmetric bounds for every axis", () => {
    expect(getSymmetricBounds(questions)).toEqual({
      tui_jin: 11,
      po_li: 11,
      xu_shi: 11,
      kuang_zhi: 11,
      qi_zheng: 11,
      rou_gang: 11,
    });
  });

  it("keeps an unanswered questionnaire at the neutral vector", () => {
    expect(calculateResult(questions, people, []).vector).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it("keeps a likert midpoint neutral", () => {
    const answers = Array<string>(18).fill("");
    answers.push("c");
    expect(calculateResult(questions, people, answers).vector).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it("scores positive and negative keyed likert items in opposite directions", () => {
    const q19Low = [...Array<string>(18).fill(""), "a"];
    const q19High = [...Array<string>(18).fill(""), "e"];
    const q20Low = [...Array<string>(19).fill(""), "a"];
    const q20High = [...Array<string>(19).fill(""), "e"];

    expect(calculateResult(questions, people, q19Low).vector[0]).toBeLessThan(0);
    expect(calculateResult(questions, people, q19High).vector[0]).toBeGreaterThan(0);
    expect(calculateResult(questions, people, q20Low).vector[1]).toBeGreaterThan(0);
    expect(calculateResult(questions, people, q20High).vector[1]).toBeLessThan(0);
  });

  it("keeps every person closest to their own vector", () => {
    for (const target of people) {
      expect(distance(target.vector, target.vector)).toBe(0);
      expect(
        people
          .filter((person) => person.id !== target.id)
          .every((person) => distance(target.vector, person.vector) > 0),
      ).toBe(true);
    }
  });

  it("breaks exact ties by stable input order", () => {
    const zeroVector: Person["vector"] = [0, 0, 0, 0, 0, 0];
    const first: Person = { ...people[0], id: "tie-first", person: "先入者", vector: [...zeroVector] };
    const second: Person = { ...people[1], id: "tie-second", person: "后入者", vector: [...zeroVector] };
    expect(calculateResult(questions, [first, second], []).primary.person.id).toBe("tie-first");
  });
});

const neighborGroups = [
  ["刘裕", "王猛"],
  ["王导", "谢安", "山涛"],
  ["何晏", "王弼", "王衍"],
  ["嵇康", "阮籍", "刘伶"],
  ["陶渊明", "陶弘景", "葛洪"],
  ["桓温", "司马昭", "刘裕"],
  ["侯景", "高洋"],
  ["苻坚", "元宏", "宇文泰"],
] as const;

describe("near-neighbor reachability", () => {
  for (const name of new Set(neighborGroups.flat())) {
    it(`keeps a complete answer path for ${name}`, () => {
      const target = people.find((person) => person.person === name);
      expect(target).toBeDefined();
      const path = findBestAnswerPath(questions, people, target!, axes, 1_600);
      expect(path.answers).toHaveLength(questions.length);
      expect(path.actual).toBe(name);
    });
  }
});
