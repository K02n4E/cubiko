const ITEMS = {
  f2l: [['Advanced F2L', 'Rare cases and efficiency', 'a', 'soon']],
  prac: [
    ['Cross Trainer', 'Plan the cross in inspection', 'b', 'https://cubelytics.net/trainers/cross'],
    ['Cross + 1', 'Cross and first pair', 'm', 'soon'],
    ['XCross Trainer', 'Cross with one pair built in', 'a', 'https://or18.github.io/RubiksSolverDemo/xcross_trainer'],
    ['Last Layer Practice', 'Practice last-layer recognition and algorithms', 'm', 'soon']
  ]
};
const LEVELS = { b: 'Beginner', m: 'Intermediate', a: 'Advanced' };

function Group({ items }) {
  return (
    <div className="group">
      {items.map(([name, description, level, destination]) => {
        const soon = destination === 'soon';
        return (
          <button key={name} type="button" className={`item ${soon ? 'disabled' : ''}`} disabled={soon}
            onClick={() => window.open(destination, '_blank', 'noopener,noreferrer')}>
            <div><span>{name}</span><small>{description}{soon ? ' · Coming Soon' : ''}</small></div>
            <span className={`lvl ${level}`}>{soon ? 'Coming Soon' : LEVELS[level]}</span>
          </button>
        );
      })}
    </div>
  );
}
export default function TrainerPage() {
  return (
    <section className="page on" id="trainer">
      <h1>Trainer</h1>
      <p className="sub">Pick a set to study or a drill to practice.</p>
      <h2>F2L</h2><Group items={ITEMS.f2l} />
      <h2>Practice trainers</h2><Group items={ITEMS.prac} />
    </section>
  );
}
