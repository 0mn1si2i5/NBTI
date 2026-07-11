export type {
  AxisDelta,
  AxisKey,
  AxisMeta,
  HistoricalFact,
  Person,
  Quote,
  Question,
  QuestionOption,
} from "../data/schema";

import type { Person } from "../data/schema";

export type MatchResult = {
  person: Person;
  distance: number;
};

export type QuizResult = {
  vector: [number, number, number, number, number, number];
  primary: MatchResult;
  secondary: MatchResult;
  opposite: MatchResult;
};
