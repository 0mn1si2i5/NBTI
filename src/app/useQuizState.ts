import { useState } from "react";
import { questions } from "../data/content";

export type QuizState = {
  index: number;
  answers: string[];
};

export function useQuizState() {
  const [state, setState] = useState<QuizState>({ index: 0, answers: [] });

  function start() {
    setState({ index: 0, answers: [] });
  }

  function reset() {
    start();
  }

  function selectAnswer(optionId: string) {
    setState((current) => {
      const answers = [...current.answers];
      answers[current.index] = optionId;
      const finished = current.index >= questions.length - 1;
      return {
        ...current,
        answers,
        index: finished ? questions.length : current.index + 1,
      };
    });
  }

  function previous() {
    setState((current) => ({ ...current, index: Math.max(0, current.index - 1) }));
  }

  return {
    state,
    start,
    reset,
    selectAnswer,
    previous,
  };
}
