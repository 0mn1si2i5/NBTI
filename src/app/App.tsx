import { useMemo } from "react";
import { people, questions } from "../data/content";
import { calculateResult } from "../logic/scoring";
import { HomePage } from "./HomePage";
import { QuizPage } from "./QuizPage";
import { ResultPage } from "./ResultPage";
import { useHashRoute } from "./useHashRoute";
import { useQuizState } from "./useQuizState";

export function App() {
  const { route, navigate } = useHashRoute();
  const quiz = useQuizState();
  const result = useMemo(() => calculateResult(questions, people, quiz.state.answers), [quiz.state.answers]);

  function startQuiz() {
    quiz.start();
    navigate("quiz");
  }

  function restartQuiz() {
    quiz.reset();
    navigate("quiz");
  }

  function selectAnswer(optionId: string) {
    const finished = quiz.state.index >= questions.length - 1;
    quiz.selectAnswer(optionId);
    if (finished) navigate("result");
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#/" aria-label="NBTI 首页">
          <span className="brand-mark">NBTI</span>
          <span className="brand-sub">魏晋南北朝人格类型测试</span>
        </a>
      </header>
      <main className="app-main" tabIndex={-1}>
        {renderRoute()}
      </main>
    </div>
  );

  function renderRoute() {
    if (route === "quiz" && quiz.state.index < questions.length) {
      return (
        <QuizPage
          question={questions[quiz.state.index]}
          index={quiz.state.index}
          total={questions.length}
          selected={quiz.state.answers[quiz.state.index]}
          onSelect={selectAnswer}
          onPrev={quiz.previous}
          onReset={restartQuiz}
        />
      );
    }

    if ((route === "quiz" || route === "result") && quiz.state.answers.length >= questions.length) {
      return (
        <ResultPage
          result={result}
          onRestart={restartQuiz}
        />
      );
    }

    return (
      <HomePage
        people={people}
        onStart={startQuiz}
      />
    );
  }
}
