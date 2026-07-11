import { useRef } from "react";
import type { QuestionOption } from "../types/nbti";

type LikertScaleProps = {
  options: QuestionOption[];
  selected?: string;
  onSelect: (optionId: string) => void;
};

export function LikertScale({ options, selected, onSelect }: LikertScaleProps) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function moveFocus(index: number, direction: number) {
    const next = (index + direction + options.length) % options.length;
    optionRefs.current[next]?.focus();
  }

  return (
    <div className="likert-scale" role="radiogroup" aria-label="这句话像不像你">
      {options.map((option, index) => (
        <button
          aria-checked={selected === option.id}
          className={`likert-option${selected === option.id ? " selected" : ""}`}
          key={option.id}
          onClick={() => onSelect(option.id)}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
              event.preventDefault();
              moveFocus(index, -1);
            }
            if (event.key === "ArrowRight" || event.key === "ArrowDown") {
              event.preventDefault();
              moveFocus(index, 1);
            }
            if (event.key === "Home") {
              event.preventDefault();
              optionRefs.current[0]?.focus();
            }
            if (event.key === "End") {
              event.preventDefault();
              optionRefs.current[options.length - 1]?.focus();
            }
          }}
          ref={(node) => {
            optionRefs.current[index] = node;
          }}
          role="radio"
          tabIndex={selected ? (selected === option.id ? 0 : -1) : index === 0 ? 0 : -1}
          type="button"
        >
          <span className="likert-mark">{option.label}</span>
          <span>{option.text}</span>
        </button>
      ))}
    </div>
  );
}
