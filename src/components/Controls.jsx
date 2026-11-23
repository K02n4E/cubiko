/** Segmented control. options: [[value, label], ...]; values keep their type (string or number). */
export function Seg({ value, options, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, text]) => <button key={String(v)} type="button" className={v === value ? 'on' : ''} aria-pressed={v === value} onClick={() => onChange(v)}>{text}</button>)}
    </div>
  );
}
export function Switch({ checked, onChange, label }) {
  return <button type="button" className="sw" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} />;
}
/** Radio-style chips. options: [[value, label], ...] */
export function Chips({ value, options, onChange, label }) {
  return (
    <div className="chips" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => <button key={String(v)} type="button" role="radio" aria-checked={v === value} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{text}</button>)}
    </div>
  );
}
export function SettingRow({ title, hint, children }) {
  return <div className="set"><div>{title}<small>{hint}</small></div>{children}</div>;
}
