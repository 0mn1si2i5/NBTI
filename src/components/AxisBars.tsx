import { axes, clamp, roundTo } from "../logic/scoring";

type AxisBarsProps = {
  vector: number[];
};

export function AxisBars({ vector }: AxisBarsProps) {
  return (
    <div className="axis-list">
      {axes.map((axis, index) => {
        const value = clamp(vector[index], -2, 2);
        return (
          <div
            className="axis-row"
            key={axis.key}
            role="meter"
            aria-label={`${axis.label}，${roundTo(value, 2)}`}
            aria-valuemin={-2}
            aria-valuemax={2}
            aria-valuenow={roundTo(value, 2)}
            title={`${axis.label}: ${roundTo(value, 2)}`}
          >
            <span className="axis-label">{axis.left}</span>
            <span className="axis-track">
              <span className="axis-dot" style={{ left: `${((value + 2) / 4) * 100}%` }} />
            </span>
            <span className="axis-label">{axis.right}</span>
          </div>
        );
      })}
    </div>
  );
}
