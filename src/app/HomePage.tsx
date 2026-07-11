import type { Person } from "../types/nbti";

type HomePageProps = {
  people: Person[];
  onStart: () => void;
};

export function HomePage({ people, onStart }: HomePageProps) {
  const showcaseNames = ["曹丕", "嵇康", "侯景"];
  const showcasePeople = showcaseNames.map((name) => people.find((person) => person.person === name)).filter(Boolean) as Person[];

  return (
    <section className="home-view">
      <div className="hero-copy">
        <p className="eyebrow">NBTI / 乱世人格切片</p>
        <h1>测测你的精神出厂设置</h1>
        <div className="hero-actions">
          <button className="primary-action" type="button" onClick={onStart}>
            开始解剖
          </button>
        </div>
      </div>

      <aside className="static-showcase" aria-label="人物背景">
        {showcasePeople.map((person, index) => (
          <img
            className="static-person"
            src={person.avatar}
            alt={`${person.person}立绘`}
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
            width={640}
            height={960}
            key={person.id}
          />
        ))}
      </aside>
    </section>
  );
}
