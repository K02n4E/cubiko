export default function StatsStrip({ entries }) {
  return (
    <div className="stats">
      {entries.map(([label, value, accent]) => (
        <div className="stat" key={label}><small>{label}</small><b className={accent ? 'acc' : ''}>{value}</b></div>
      ))}
    </div>
  );
}
