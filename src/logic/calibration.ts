import { axisKeys } from "../data/schema";
import type { AxisKey, AxisMeta, Person, Question, QuestionOption } from "../types/nbti";
import { calculateResult, getSymmetricBounds, roundTo } from "./scoring";

export type CalibrationPath = {
  target: string;
  actual: string;
  reached: boolean;
  answers: string[];
  vector: number[];
};

export function findBestAnswerPath(
  questions: Question[],
  people: Person[],
  target: Person,
  axes: AxisMeta[],
  beamWidth = 2_400,
): CalibrationPath {
  type State = { raw: number[]; answers: string[]; score: number };
  const bounds = getSymmetricBounds(questions);
  let states: State[] = [{ raw: axisKeys.map(() => 0), answers: [], score: Number.POSITIVE_INFINITY }];

  for (const question of questions) {
    const next: State[] = [];
    for (const state of states) {
      for (const option of question.options) {
        const raw = applyOption(state.raw, option);
        const vector = vectorForRaw(raw, bounds);
        next.push({
          raw,
          answers: [...state.answers, option.id],
          score: weightedDistance(vector, target.vector, axes),
        });
      }
    }
    next.sort((a, b) => a.score - b.score);
    states = next.slice(0, beamWidth);
  }

  const best = states[0];
  const result = calculateResult(questions, people, best.answers);
  return {
    target: target.person,
    actual: result.primary.person.person,
    reached: result.primary.person.person === target.person,
    answers: best.answers,
    vector: result.vector,
  };
}

function applyOption(raw: readonly number[], option: QuestionOption) {
  const next = [...raw];
  for (const [axis, value] of Object.entries(option.delta)) {
    next[axisKeys.indexOf(axis as AxisKey)] += value;
  }
  return next;
}

function vectorForRaw(raw: readonly number[], bounds: Record<AxisKey, number>) {
  return axisKeys.map((axis, index) => roundTo(Math.max(-1, Math.min(1, raw[index] / bounds[axis])) * 2, 2));
}

function weightedDistance(userVector: readonly number[], personVector: readonly number[], axes: AxisMeta[]) {
  return Math.sqrt(
    axes.reduce((sum, axis, index) => {
      const difference = userVector[index] - personVector[index];
      return sum + axis.weight * difference * difference;
    }, 0),
  );
}
