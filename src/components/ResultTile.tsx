import type { MatchResult } from "../types/nbti";

type ResultTileProps = {
  result: MatchResult;
  kicker: string;
  inverse?: boolean;
};

export function ResultTile({ result, kicker, inverse = false }: ResultTileProps) {
  const person = result.person;
  return (
    <article className={`result-tile${inverse ? " inverse" : ""}`}>
      <p className="result-kicker">{kicker}</p>
      <h2>
        {person.person} · {person.title}
      </h2>
    </article>
  );
}
