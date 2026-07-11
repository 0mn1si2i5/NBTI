import { axes } from "../data/content";
import { axisKeys } from "../data/schema";
import type { AxisKey, Person, Question, QuizResult } from "../types/nbti";

export { axes };

export function calculateResult(
  questions: Question[],
  people: Person[],
  answers: string[],
): QuizResult {
  const raw = Object.fromEntries(axisKeys.map((axis) => [axis, 0])) as Record<AxisKey, number>;
  const bounds = getSymmetricBounds(questions);

  questions.forEach((question, index) => {
    const answer = question.options.find((option) => option.id === answers[index]);
    if (!answer) return;

    Object.entries(answer.delta).forEach(([axis, value]) => {
      raw[axis as AxisKey] += Number(value || 0);
    });
  });

  const vector = axisKeys.map((axis) => {
    const value = raw[axis];
    return roundTo(clamp(value / bounds[axis], -1, 1) * 2, 2);
  }) as QuizResult["vector"];

  const ranked = people
    .map((person, index) => ({ person, distance: distance(vector, person.vector), index }))
    .sort((a, b) => a.distance - b.distance || a.index - b.index)
    .map(({ person, distance: resultDistance }) => ({ person, distance: resultDistance }));

  return {
    vector,
    primary: ranked[0],
    secondary: ranked[1],
    opposite: ranked[ranked.length - 1],
  };
}

export function roundTo(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function getSymmetricBounds(questions: Question[]) {
  const bounds = Object.fromEntries(axisKeys.map((axis) => [axis, 0])) as Record<AxisKey, number>;

  questions.forEach((question) => {
    axisKeys.forEach((axis) => {
      const values = question.options.map((option) => option.delta[axis] || 0);
      bounds[axis] += Math.max(Math.abs(Math.min(...values)), Math.abs(Math.max(...values)));
    });
  });

  return bounds;
}

export function distance(userVector: readonly number[], personVector: readonly number[]) {
  return Math.sqrt(
    axes.reduce((sum, axis, index) => {
      const diff = userVector[index] - personVector[index];
      return sum + axis.weight * diff * diff;
    }, 0),
  );
}
