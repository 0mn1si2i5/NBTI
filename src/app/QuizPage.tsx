import { useEffect, useRef } from "react";
import { LikertScale } from "../components/LikertScale";
import type { Question } from "../types/nbti";

type QuizPageProps = {
  question: Question;
  index: number;
  total: number;
  selected?: string;
  onSelect: (optionId: string) => void;
  onPrev: () => void;
  onReset: () => void;
};

export function QuizPage({ question, index, total, selected, onSelect, onPrev, onReset }: QuizPageProps) {
  const progress = Math.round(((index + 1) / total) * 100);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: 0 }));
    return () => window.cancelAnimationFrame(frame);
  }, [question.id]);

  return (
    <section className={`quiz-view ${question.type}`}>
      <div className="quiz-topline">
        <div>
          <p className="eyebrow">
            样本 {index + 1} / {total}
          </p>
          <h1 ref={headingRef} tabIndex={-1}>
            {question.text}
          </h1>
        </div>
        <div className="progress-number">
          {index + 1}/{total}
        </div>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="答题进度"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={index + 1}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      {question.type === "likert" ? (
        <LikertScale options={question.options} selected={selected} onSelect={onSelect} />
      ) : (
        <div className="option-list">
          {question.options.map((option) => (
            <button
              className={`option-button${selected === option.id ? " selected" : ""}`}
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
            >
              <span className="option-key">{option.label}</span>
              <span className="option-text">{option.text}</span>
            </button>
          ))}
        </div>
      )}
      <div className="quiz-controls">
        <button className="secondary-action" type="button" disabled={index === 0} onClick={onPrev}>
          回上一层
        </button>
        <button className="ghost-action" type="button" onClick={onReset}>
          清空重来
        </button>
      </div>
    </section>
  );
}
