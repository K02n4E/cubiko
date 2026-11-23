import { useEffect, useMemo, useRef, useState } from 'react';
import StatsStrip from '../components/StatsStrip';
import { useSolves } from '../hooks/useSolves';
import { average, best, format, mean, valueOf } from '../lib/stats';

const HIGH = 30, MAX_POINTS = 120;

function Chart({ solves }) {
  const wrap = useRef(null);
  const [width, setWidth] = useState(800);
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const measure = () => setWidth(Math.max(300, Math.round(el.clientWidth - 24)) || 800);
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const view = useMemo(() => {
    const W = width, H = W < 520 ? 220 : 280, margin = { l: 42, r: 12, t: 12, b: 25 };
    const offset = Math.max(0, solves.length - MAX_POINTS), shown = solves.slice(offset);
    const x = i => shown.length < 2 ? W / 2 : margin.l + i * (W - margin.l - margin.r) / (shown.length - 1);
    const y = v => margin.t + (HIGH - v) * (H - margin.t - margin.b) / HIGH;
    const singles = shown.map((s, i) => { const v = valueOf(s); return `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(Number.isFinite(v) ? Math.min(v, HIGH) : HIGH).toFixed(1)}`; }).join('');
    const averages = [];
    for (let i = 0; i < shown.length; i++) {
      const avg = average(solves.slice(0, offset + i + 1), 12);
      if (avg !== null && Number.isFinite(avg)) averages.push(`${averages.length ? 'L' : 'M'}${x(i).toFixed(1)} ${y(Math.min(avg, HIGH)).toFixed(1)}`);
    }
    return { W, H, margin, y, singles, averages: averages.join(''), count: shown.length };
  }, [solves, width]);

  const { W, H, margin, y } = view;
  return (
    <div className="chart" ref={wrap}>
      <div className="legend"><span><i style={{ background: 'var(--muted)' }} />Single</span><span><i style={{ background: 'var(--accent)' }} />Ao12</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Solve times over the last ${MAX_POINTS} solves`}>
        {[0, 5, 10, 15, 20, 25, 30].map(v => (
          <g key={v}>
            <line x1={margin.l} x2={W - margin.r} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={margin.l - 8} y={y(v) + 4} textAnchor="end" fill="var(--muted)" fontSize="11">{v}s</text>
          </g>
        ))}
        {view.count === 0
          ? <text x={W / 2} y={H / 2} textAnchor="middle" fill="var(--muted)" fontSize="14">Your solve times will appear here.</text>
          : <>
              <path d={view.singles} fill="none" stroke="var(--muted)" strokeWidth="1.2" opacity=".65" />
              {view.averages && <path d={view.averages} fill="none" stroke="var(--accent)" strokeWidth="2.2" />}
            </>}
      </svg>
    </div>
  );
}

export default function StatisticsPage() {
  const { solves } = useSolves();
  const entries = [['Best single', format(best(solves)), true], ['Mean', format(mean(solves))], ['Ao5', format(average(solves, 5))], ['Ao12', format(average(solves, 12))], ['Ao100', format(average(solves, 100))], ['Total solves', solves.length]];

  const sessions = useMemo(() => {
    const groups = new Map();
    solves.forEach(solve => {
      const date = new Date(solve.date || Date.now()).toLocaleDateString();
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date).push(solve);
    });
    return [...groups.entries()].slice(-5).reverse().map(([date, list]) => {
      let bestAo5 = null;
      for (let i = 5; i <= list.length; i++) {
        const current = average(list.slice(0, i), 5);
        if (current !== null && (bestAo5 === null || current < bestAo5)) bestAo5 = current;
      }
      return { date, count: list.length, best: best(list), mean: mean(list), bestAo5 };
    });
  }, [solves]);

  return (
    <section className="page on" id="statistics">
      <h1>Statistics</h1>
      <p className="sub">Based on your {solves.length} recorded {solves.length === 1 ? 'solve' : 'solves'}.</p>
      <StatsStrip entries={entries} />
      <h2>Solve progression</h2>
      <Chart solves={solves} />
      <h2>Recent sessions</h2>
      <div className="tw">
        <table>
          <thead><tr><th>Session</th><th>Solves</th><th>Best</th><th>Mean</th><th>Best Ao5</th></tr></thead>
          <tbody>
            {sessions.length ? sessions.map(s => (
              <tr key={s.date}><td>{s.date}</td><td>{s.count}</td><td>{format(s.best)}</td><td>{format(s.mean)}</td><td>{format(s.bestAo5)}</td></tr>
            )) : <tr><td colSpan={5} className="empty">No sessions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
