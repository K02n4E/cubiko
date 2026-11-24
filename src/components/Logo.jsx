const COLORS = ['#F8FAFC', '#FACC15', '#EF4444', '#F97316', 'var(--accent)', '#3B82F6', '#22C55E', '#F8FAFC', '#FACC15'];

export default function Logo() {
  return (
    <div className="logo">
      <svg className="mark" viewBox="0 0 24 24" aria-hidden="true">
        {COLORS.map((fill, i) => <rect key={i} x={1 + (i % 3) * 7.8} y={1 + Math.floor(i / 3) * 7.8} width="6.4" height="6.4" rx="1.2" fill={fill} />)}
      </svg>
      Cubi<b>ko</b>
    </div>
  );
}
