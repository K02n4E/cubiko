import { useToast } from '../hooks/useToast';

const ICONS = {
  pb: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  slow: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  win: <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />,
  info: <path d="m5 12 5 5L20 7" />,
  error: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h0" /></>
};
export default function Toast() {
  const { toast, hide } = useToast();
  if (!toast) return null;
  return (
    <div className={`toast ${toast.kind}`} role="status" aria-live="polite" onClick={hide}>
      <div className="t-icon"><svg className="i" viewBox="0 0 24 24">{ICONS[toast.kind] || ICONS.pb}</svg></div>
      <div><p className="t-title">{toast.title}</p>{toast.sub && <p className="t-sub">{toast.sub}</p>}</div>
    </div>
  );
}
