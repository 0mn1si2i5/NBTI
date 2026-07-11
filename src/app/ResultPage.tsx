import { useState } from "react";
import { AxisBars } from "../components/AxisBars";
import { ResultTile } from "../components/ResultTile";
import { SITE_URL } from "../data/site";
import { downloadPoster } from "../logic/poster";
import type { QuizResult } from "../types/nbti";

type ResultPageProps = {
  result: QuizResult;
  onRestart: () => void;
};

export function ResultPage({ result, onRestart }: ResultPageProps) {
  const [shareText, setShareText] = useState("");
  const [posterBusy, setPosterBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const person = result.primary.person;

  async function handlePoster() {
    setPosterBusy(true);
    setStatusMessage("");
    try {
      await downloadPoster({ result });
      setStatusMessage("海报已生成。文件会保存在浏览器的下载目录。");
    } catch {
      setStatusMessage("海报生成失败，请稍后再试。");
    } finally {
      setPosterBusy(false);
    }
  }

  async function handleShare() {
    const text = `我的 NBTI 精神切片：${person.person} · ${person.title}\n${person.quote.text}\n${person.why}\n\n测测你的：${SITE_URL}`;
    setShareText(text);
    try {
      await navigator.clipboard.writeText(text);
      setStatusMessage("分享文字已复制。");
    } catch {
      setStatusMessage("分享文字已生成，可以在下方手动复制。");
    }
  }

  return (
    <section className="result-view">
      <section className="result-hero">
        <div className="result-layout">
          <img
            className="persona-avatar large"
            src={person.avatar}
            alt={`${person.person}立绘`}
            loading="eager"
            decoding="async"
            width={640}
            height={960}
          />
          <div className="result-copy">
            <p className="result-kicker">主切片</p>
            <h1 className="result-name">
              <strong>{person.person}</strong>
              <span>{person.title}</span>
            </h1>
            <blockquote className="quote">
              <p>{person.quote.text}</p>
              <a href={person.quote.sourceUrl} target="_blank" rel="noreferrer">
                {person.quote.sourceTitle}
                {person.quote.locator === person.quote.sourceTitle ? "" : ` · ${person.quote.locator}`}
              </a>
            </blockquote>
            <p className="why">{person.why}</p>
            <div className="result-axes">
              <h2>偏移量</h2>
              <AxisBars vector={result.vector} />
            </div>
          </div>
        </div>
      </section>

      {person.facts?.length ? (
        <section className="fact-section">
          <div className="section-title">
            <h2>史料边角</h2>
          </div>
          <div className="fact-list">
            {person.facts.map((fact) => (
              <article className="fact-card" key={`${fact.sourceTitle}-${fact.text}`}>
                <p>{fact.text}</p>
                <a href={fact.sourceUrl} target="_blank" rel="noreferrer">
                  {fact.sourceTitle}
                </a>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="result-grid" aria-label="相邻与反向结果">
        <ResultTile result={result.secondary} kicker="近邻切片" />
        <ResultTile result={result.opposite} kicker="反向样本" inverse />
      </section>

      <div className="result-actions">
        <button className="primary-action" type="button" onClick={handlePoster} disabled={posterBusy}>
          {posterBusy ? "正在生成" : "保存结果卡"}
        </button>
        <button className="secondary-action" type="button" onClick={handleShare}>
          复制结果
        </button>
        <button className="ghost-action" type="button" onClick={onRestart}>
          重新测试
        </button>
      </div>
      {shareText && <textarea className="share-box" readOnly value={shareText} />}
      {statusMessage && (
        <p className="action-status" role="status">
          {statusMessage}
        </p>
      )}
    </section>
  );
}
